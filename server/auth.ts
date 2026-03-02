import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { sendOtpEmail } from "./email";
import { api } from "@shared/routes";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    let saString = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    // Remove leading/trailing quotes if present (standard in some env loaders)
    if ((saString.startsWith("'") && saString.endsWith("'")) || 
        (saString.startsWith('"') && saString.endsWith('"'))) {
      saString = saString.slice(1, -1);
    }
    
    const serviceAccount = JSON.parse(saString);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[firebase-admin] Initialized successfully");
  } catch (err) {
    console.error("[firebase-admin] Failed to initialize:", err);
    console.log("[firebase-admin] Raw service account string (first 20 chars):", process.env.FIREBASE_SERVICE_ACCOUNT.substring(0, 20));
  }
} else {
  console.warn("[firebase-admin] FIREBASE_SERVICE_ACCOUNT is missing in environment");
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// --- Pending registration store (in-memory, expires in 10 min) ---
interface PendingRegistration {
  username: string;
  email: string;
  hashedPassword: string;
  otp: string;
  expiresAt: Date;
}
const pendingRegistrations = new Map<string, PendingRegistration>(); // key = email

function cleanExpiredPending() {
  const now = new Date();
  for (const [email, entry] of Array.from(pendingRegistrations.entries())) {
    if (entry.expiresAt < now) pendingRegistrations.delete(email);
  }
}
// ----------------------------------------------------------------

export function setupAuth(app: Express) {
  const PostgresStore = connectPg(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "hackathon-secret",
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({
      pool,
      createTableIfMissing: true,
    }),
    cookie: {
      httpOnly: true,
      secure: app.get("env") === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        if (!user.emailVerified) {
          return done(null, false, { message: "Email not verified" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Step 1: Register Check — validate username/email availability
  app.post("/api/auth/register-check", async (req, res, next) => {
    try {
      const { username, email } = req.body;

      // Check DB for existing username / email
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      res.status(200).json({ message: "Username and email are available" });
    } catch (err) {
      next(err);
    }
  });

  // Step 2: Register — validate & store pending (Legacy OTP - keep for now but we'll use registerCheck)
  app.post("/api/register", async (req, res, next) => {
    try {
      cleanExpiredPending();

      const { username, email, password } = req.body;

      // Check DB for existing username / email
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check pending store (don't allow duplicate pending)
      if (pendingRegistrations.has(email)) {
        return res.status(400).json({
          message:
            "A verification code was already sent to this email. Please check your inbox or wait for it to expire.",
        });
      }

      const hashedPassword = await hashPassword(password);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      pendingRegistrations.set(email, {
        username,
        email,
        hashedPassword,
        otp,
        expiresAt,
      });

      await sendOtpEmail(email, otp);

      res.status(201).json({
        message:
          "Verification code sent. Please check your email to complete registration.",
      });
    } catch (err) {
      next(err);
    }
  });

  // Resend OTP — checks pending store first, then DB for legacy unverified users
  app.post(api.auth.sendVerification.path, async (req, res) => {
    const { email } = req.body;

    cleanExpiredPending();
    const pending = pendingRegistrations.get(email);
    if (pending) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      pending.otp = otp;
      pending.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await sendOtpEmail(email, otp);
      return res.json({ message: "Verification code resent" });
    }

    // Fallback: existing unverified DB user (legacy path)
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await storage.updateUser(user.id, { otpCode: otp, otpExpiry });
    await sendOtpEmail(user.email, otp);

    res.json({ message: "Verification code sent" });
  });

  // Step 2: Verify OTP — create DB user only after successful verification
  app.post(api.auth.verifyOtp.path, async (req, res) => {
    const { email, code } = req.body;

    cleanExpiredPending();
    const pending = pendingRegistrations.get(email);

    if (pending) {
      if (pending.otp !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      if (pending.expiresAt < new Date()) {
        pendingRegistrations.delete(email);
        return res.status(400).json({ message: "Verification code expired" });
      }

      // OTP is valid — now create the user in the DB
      await storage.createUser({
        username: pending.username,
        email: pending.email,
        password: pending.hashedPassword,
      });
      pendingRegistrations.delete(email);

      // Mark as verified immediately after creation
      const newUser = await storage.getUserByEmail(pending.email);
      if (newUser) {
        await storage.updateUser(newUser.id, {
          emailVerified: 1,
          otpCode: null,
          otpExpiry: null,
        });
      }

      return res.json({
        message: "Email verified successfully. You can now log in.",
      });
    }

    // Fallback: existing unverified DB user (legacy path)
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified" });
    if (user.otpCode !== code)
      return res.status(400).json({ message: "Invalid verification code" });
    if (user.otpExpiry && user.otpExpiry < new Date())
      return res.status(400).json({ message: "Verification code expired" });

    await storage.updateUser(user.id, {
      emailVerified: 1,
      otpCode: null,
      otpExpiry: null,
    });
    res.json({ message: "Email verified successfully" });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  app.post(api.auth.firebaseVerify.path, async (req, res, next) => {
    try {
      console.log("[firebase-verify] Received verification request");
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.error("[firebase-verify] FIREBASE_SERVICE_ACCOUNT is missing");
        return res.status(500).json({ message: "Firebase is not configured on the server" });
      }

      const { idToken } = req.body;
      if (!idToken) {
        console.error("[firebase-verify] idToken is missing in request body");
        return res.status(400).json({ message: "idToken is required" });
      }

      console.log("[firebase-verify] Verifying token...");
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const email = decodedToken.email;
      console.log("[firebase-verify] Token verified for email:", email);

      if (!email) {
        return res.status(400).json({ message: "Email not found in Firebase token" });
      }

      const { username, password } = req.body;
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Registration Flow: Use provided username/password or fallback to email prefix
        let finalUsername = username || email.split("@")[0];
        const existingUsername = await storage.getUserByUsername(finalUsername);
        if (existingUsername) {
          finalUsername = `${finalUsername}_${Math.floor(Math.random() * 1000)}`;
        }

        user = await storage.createUser({
          username: finalUsername,
          email,
          password: password ? await hashPassword(password) : "firebase-managed-auth",
        });

        // Mark as verified via Firebase immediately
        await storage.updateUser(user.id, { emailVerified: 1 });
        user.emailVerified = 1;

        console.log(`[firebase-verify] Created new user: ${email} with username: ${finalUsername}`);
      } else {
        // Login Flow: Ensure verified status
        if (!user.emailVerified) {
          await storage.updateUser(user.id, { emailVerified: 1 });
          user.emailVerified = 1;
        }
      }

      // Log the user in via Passport
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user as SelectUser;
        res.status(200).json(userWithoutPassword);
      });
    } catch (err: any) {
      console.error("[firebase-verify] Firebase token verification failed ERROR DETAILS:", err);
      // Log specific error codes if available
      if (err.code) console.error("[firebase-verify] Error code:", err.code);
      res.status(401).json({ message: "Invalid Firebase token" });
    }
  });
}

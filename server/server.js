const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const fs = require("fs")
require("dotenv").config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname === "logo" ? "logos" : "documents"
    const dir = `uploads/${type}`
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  },
})

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "logo") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Le fichier doit être une image"), false)
    }
  } else if (file.fieldname === "validationDoc") {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true)
    } else {
      cb(new Error("Le document doit être un PDF ou DOC/DOCX"), false)
    }
  } else {
    cb(null, false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (file) => {
      if (file.fieldname === "logo") {
        return 2 * 1024 * 1024 // 2MB pour les logos
      } else if (file.fieldname === "validationDoc") {
        return 10 * 1024 * 1024 // 10MB pour les documents
      }
    },
  },
})

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connecté à MongoDB"))
  .catch((err) => console.error("Erreur de connexion :", err))

// Schema pour User
const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    age: { type: Number, required: true },
    cin: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    poste: {
      type: String,
      enum: ["administrateur", "etudiant", "responsable"],
      required: true,
    },
    etablissement: {
      type: String,
      enum: [
        "Ariana",
        "Beja",
        "Ben Arous",
        "Bizerte",
        "Gabes",
        "Gafsa",
        "Jendouba",
        "Kairouan",
        "Kasserine",
        "Kebili",
        "Le Kef",
        "Mahdia",
        "Manouba",
        "Medenine",
        "Monastir",
        "Nabeul",
        "Sfax",
        "Sidi Bouzid",
        "Siliana",
        "Sousse",
        "Tataouine",
        "Tozeur",
        "Tunis",
        "Zaghouan",
      ],
      required: true,
    },
  },
  { timestamps: true },
)

const User = mongoose.model("User", userSchema)

// Schema pour Club
const clubSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  responsable: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Non requis maintenant
  etablissement: { type: String, required: true },
  logo: { type: String },
  validationDoc: { type: String },
  membres: [
    {
      email: { type: String, required: true },
      role: { type: String, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  dateCreation: { type: Date, default: Date.now },
  statutValidation: {
    type: String,
    enum: ["en_attente", "validé", "refusé"],
    default: "en_attente",
  },
})

const Club = mongoose.model("Club", clubSchema)

// Schema pour DemandeClub
const demandeClubSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    age: { type: Number, required: true },
    specialite: { type: String, required: true },
    idScolaire: { type: String, required: true },
    skills: { type: String, required: true },
    acceptRules: { type: Boolean, required: true, default: false },
    statut: {
      type: String,
      enum: ["en_attente", "acceptée", "refusée"],
      default: "en_attente",
    },
    dateCreation: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

const DemandeClub = mongoose.model("DemandeClub", demandeClubSchema)

// Schema pour Temoignage
const temoignageSchema = new mongoose.Schema(
  {
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    opinion: { type: String, required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
  },
  { timestamps: true },
)

const Temoignage = mongoose.model("Temoignage", temoignageSchema)

// Schema pour Reclamation
const reclamationSchema = new mongoose.Schema(
  {
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sujet: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["general", "technique", "administratif", "suggestion", "autre"],
      default: "general",
    },
    statut: {
      type: String,
      enum: ["en_attente", "en-cours", "resolue", "rejetee"],
      default: "en_attente",
    },
    reponse: { type: String },
  },
  { timestamps: true },
)

const Reclamation = mongoose.model("Reclamation", reclamationSchema)

// Middleware d'authentification
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token")

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: "Pas de token, autorisation refusée" })
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded.user
    next()
  } catch (err) {
    res.status(401).json({ message: "Token non valide" })
  }
}

// Fonction pour calculer l'âge
function calculateAge(dateOfBirth) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Routes d'authentification
// Route d'inscription
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nom, prenom, dateNaissance, cin, email, password, poste, etablissement } = req.body

    // Validation des champs requis
    if (!nom || !prenom || !dateNaissance || !cin || !email || !password || !poste || !etablissement) {
      return res.status(400).json({ message: "Tous les champs sont requis." })
    }

    // Calculer l'âge
    let age
    try {
      age = calculateAge(dateNaissance)
    } catch (error) {
      return res.status(400).json({ message: error.message })
    }

    // user mawjoud wela le
    const existingUserByEmail = await User.findOne({ email })
    if (existingUserByEmail) return res.status(400).json({ message: "Email déjà utilisé." })

    const existingUserByCin = await User.findOne({ cin })
    if (existingUserByCin) return res.status(400).json({ message: "CIN déjà utilisé." })

    // Hachage
    const hashedPassword = await bcrypt.hash(password, 10)

    // user jdid
    const newUser = new User({
      nom,
      prenom,
      age,
      cin,
      email,
      password: hashedPassword,
      poste,
      etablissement,
    })

    await newUser.save()
    res.status(201).json({ message: "Utilisateur enregistré avec succès." })
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    res.status(500).json({ message: "Erreur lors de l'inscription." })
  }
})

// Route de connexion
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Valider les champs
    if (!email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis." })
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Identifiants invalides." })
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Identifiants invalides." })
    }

    // Créer et signer le token JWT
    const payload = {
      user: {
        id: user.id,
        poste: user.poste,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err
      res.json({
        token,
        message: "Connexion réussie",
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          poste: user.poste,
        },
      })
    })
  } catch (error) {
    console.error("Erreur lors de la connexion:", error)
    res.status(500).json({ message: "Erreur lors de la connexion." })
  }
})

// Route pour obtenir les informations de l'utilisateur connecté
app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch (error) {
    console.error("Erreur lors de la récupération des données utilisateur:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir tous les utilisateurs (hors administrateurs)
app.get("/api/users", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    const users = await User.find({ poste: { $ne: "administrateur" } }).select("-password")
    res.json(users)
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Supprimer un utilisateur
app.delete("/api/users/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    const userToDelete = await User.findById(req.params.id)
    if (!userToDelete) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    if (userToDelete.poste === "administrateur") {
      return res.status(400).json({ message: "Impossible de supprimer un administrateur" })
    }

    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "Utilisateur supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== CLUB ROUTES ====================
// IMPORTANT: These routes need to be defined BEFORE any other club routes that use :id parameter

// Approve a club - IMPORTANT: This route must be defined BEFORE the generic club routes
app.put("/api/clubs/:id/approve", auth, async (req, res) => {
  try {
    console.log("Approving club with ID:", req.params.id)

    // Verify admin role
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    const club = await Club.findById(req.params.id)

    if (!club) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    // Update to match your schema
    club.statutValidation = "validé"

    // Find the creator member (if any)
    const creatorMember = club.membres.find((member) => member.role === "Créateur")

    // If there's a creator member with a userId, set them as the responsable
    if (creatorMember && creatorMember.userId) {
      club.responsable = creatorMember.userId
    } else if (club.membres.length > 0 && club.membres[0].userId) {
      // Otherwise, set the first member with a userId as the responsable
      club.responsable = club.membres[0].userId

      // Update their role to Créateur
      club.membres[0].role = "Créateur"
    } else if (req.body.responsableId) {
      // If a specific responsableId is provided in the request body, use that
      club.responsable = req.body.responsableId
    }

    await club.save()

    // If a responsable was set, update their poste to "responsable"
    if (club.responsable) {
      await User.findByIdAndUpdate(club.responsable, { poste: "responsable" })
    }

    // NOUVEAU: Mettre à jour toutes les demandes associées à ce club
    await DemandeClub.updateMany({ club: club._id, statut: "en_attente" }, { $set: { statut: "acceptée" } })

    res.json({ message: "Club approuvé avec succès", club })
  } catch (error) {
    console.error("Error approving club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Reject a club - IMPORTANT: This route must be defined BEFORE the generic club routes
app.put("/api/clubs/:id/reject", auth, async (req, res) => {
  try {
    console.log("Rejecting club with ID:", req.params.id)

    // Verify admin role
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    const club = await Club.findById(req.params.id)

    if (!club) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    // Update to match your schema
    club.statutValidation = "refusé"
    await club.save()

    res.json({ message: "Club rejeté avec succès", club })
  } catch (error) {
    console.error("Error rejecting club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les clubs
// Créer un nouveau club (ancienne version)
app.post("/api/clubs", auth, async (req, res) => {
  try {
    const { nom, description, etablissement, logo } = req.body

    // Vérifier si l'utilisateur est un responsable
    const user = await User.findById(req.user.id)
    if (user.poste !== "responsable") {
      return res.status(403).json({ message: "Seuls les responsables peuvent créer des clubs" })
    }

    const newClub = new Club({
      nom,
      description,
      responsable: req.user.id,
      etablissement,
      logo,
      membres: [
        {
          email: user.email,
          role: "Créateur",
          userId: req.user.id,
        },
      ],
    })

    await newClub.save()
    res.status(201).json({ message: "Club créé avec succès", club: newClub })
  } catch (error) {
    console.error("Erreur lors de la création du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Nouvelle route pour créer un club avec uploads (CreateClub component)
// Nouvelle route pour créer un club sans authentification
app.post(
  "/api/clubs/create-public",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "validationDoc", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { clubName, description, creationDate, etablissement, activeMembers } = req.body

      // Validation des champs
      if (!clubName) {
        return res.status(400).json({ message: "Le nom du club est obligatoire" })
      }

      if (!etablissement) {
        return res.status(400).json({ message: "L'établissement est obligatoire" })
      }

      // Gestion des fichiers
      const logoPath = req.files.logo ? req.files.logo[0].path : null
      const validationDocPath = req.files.validationDoc ? req.files.validationDoc[0].path : null

      // Traitement des membres
      const membres = []
      try {
        const parsedMembers = JSON.parse(activeMembers)

        // Ajouter les membres
        for (const member of parsedMembers) {
          // Vérifier si l'email est déjà utilisé par un utilisateur existant
          const existingUser = await User.findOne({ email: member.email })

          membres.push({
            email: member.email,
            role: member.role,
            userId: existingUser ? existingUser._id : null,
          })
        }
      } catch (error) {
        console.error("Erreur lors du traitement des membres:", error)
        return res.status(400).json({ message: "Format des membres invalide" })
      }

      // Création du club sans responsable spécifique
      const newClub = new Club({
        nom: clubName,
        description: description || "",
        responsable: null, // Pas de responsable spécifique
        etablissement: etablissement,
        logo: logoPath,
        validationDoc: validationDocPath,
        membres: membres,
        dateCreation: creationDate || new Date(),
        statutValidation: "en_attente", // Ajout d'un statut de validation
      })

      await newClub.save()

      res.status(201).json({
        success: true,
        message: "Club créé avec succès et en attente de validation",
        club: {
          id: newClub._id,
          nom: newClub.nom,
          description: newClub.description,
          logoUrl: logoPath ? `/${logoPath}` : null,
        },
      })
    } catch (error) {
      console.error("Erreur lors de la création du club:", error)

      // Suppression des fichiers en cas d'erreur
      if (req.files) {
        if (req.files.logo) {
          fs.unlink(req.files.logo[0].path, (err) => {
            if (err) console.error("Erreur lors de la suppression du logo:", err)
          })
        }

        if (req.files.validationDoc) {
          fs.unlink(req.files.validationDoc[0].path, (err) => {
            if (err) console.error("Erreur lors de la suppression du document:", err)
          })
        }
      }

      res.status(500).json({
        success: false,
        message: error.message || "Erreur lors de la création du club",
      })
    }
  },
)

// Get pending club requests
app.get("/api/clubs/pending", auth, async (req, res) => {
  try {
    // Verify admin role
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    // Change this line - we need to query by statutValidation, not by _id
    const pendingClubs = await Club.find({ statutValidation: "en_attente" })
      .populate("responsable", "nom prenom email")
      .populate("createdBy", "nom prenom email")

    res.json(pendingClubs)
  } catch (error) {
    console.error("Error fetching pending clubs:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir tous les clubs
app.get("/api/clubs", async (req, res) => {
  try {
    const clubs = await Club.find().populate("responsable", "nom prenom")
    res.json(clubs)
  } catch (error) {
    console.error("Erreur lors de la récupération des clubs:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir un club spécifique
app.get("/api/clubs/:id", async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate("responsable", "nom prenom email")
      .populate("membres.userId", "nom prenom email")

    if (!club) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    res.json(club)
  } catch (error) {
    console.error("Erreur lors de la récupération du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Nouvelle route pour envoyer une demande d'adhésion à un club
app.post("/api/clubs/:id/demande", auth, async (req, res) => {
  try {
    const clubId = req.params.id
    const userId = req.user.id

    // Vérifier si le club existe
    const club = await Club.findById(clubId)
    if (!club) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    // Vérifier si l'utilisateur est déjà membre du club
    const isMember = club.membres.some((member) => member.userId && member.userId.equals(userId))

    if (isMember) {
      return res.status(400).json({ message: "Vous êtes déjà membre de ce club" })
    }

    // Vérifier si l'utilisateur a déjà une demande en attente
    const existingDemande = await DemandeClub.findOne({
      club: clubId,
      etudiant: userId,
      statut: "en_attente",
    })

    if (existingDemande) {
      return res.status(400).json({ message: "Vous avez déjà une demande en attente pour ce club" })
    }

    // Créer la nouvelle demande
    const { nom, prenom, age, specialite, idScolaire, skills, acceptRules } = req.body

    if (!acceptRules) {
      return res.status(400).json({ message: "Vous devez accepter les règles de discipline" })
    }

    const nouvelleDemande = new DemandeClub({
      club: clubId,
      etudiant: userId,
      nom,
      prenom,
      age,
      specialite,
      idScolaire,
      skills,
      acceptRules,
    })

    await nouvelleDemande.save()

    res.status(201).json({
      success: true,
      message: "Votre demande d'adhésion a été envoyée avec succès",
      demande: nouvelleDemande,
    })
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande d'adhésion:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de l'envoi de la demande d'adhésion",
    })
  }
})

// Route pour obtenir toutes les demandes d'adhésion (pour les responsables et administrateurs)
app.get("/api/demandes", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    // Vérifier les droits d'accès
    if (user.poste !== "administrateur" && user.poste !== "responsable") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    let demandes

    if (user.poste === "administrateur") {
      // L'administrateur peut voir toutes les demandes
      demandes = await DemandeClub.find().populate("club", "nom etablissement").populate("etudiant", "nom prenom email")
    } else {
      // Le responsable ne peut voir que les demandes pour ses clubs
      const clubsResponsable = await Club.find({ responsable: user._id }).select("_id")
      const clubIds = clubsResponsable.map((club) => club._id)

      demandes = await DemandeClub.find({ club: { $in: clubIds } })
        .populate("club", "nom etablissement")
        .populate("etudiant", "nom prenom email")
    }

    res.json(demandes)
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour obtenir les demandes d'un étudiant
app.get("/api/mes-demandes", auth, async (req, res) => {
  try {
    const demandes = await DemandeClub.find({ etudiant: req.user.id })
      .populate("club", "nom etablissement logo")
      .sort({ createdAt: -1 })

    res.json(demandes)
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour traiter une demande (accepter ou refuser)
app.put("/api/demandes/:id", auth, async (req, res) => {
  try {
    const { statut } = req.body

    if (!statut || !["acceptée", "refusée"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const demande = await DemandeClub.findById(req.params.id).populate("club").populate("etudiant")

    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée" })
    }

    const user = await User.findById(req.user.id)

    // Vérifier les droits d'accès
    if (user.poste !== "administrateur" && (!demande.club.responsable || !demande.club.responsable.equals(user._id))) {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour traiter cette demande" })
    }

    // Mettre à jour le statut de la demande
    demande.statut = statut
    await demande.save()

    // Si la demande est acceptée, ajouter l'étudiant comme membre du club
    if (statut === "acceptée") {
      const club = await Club.findById(demande.club._id)

      // Vérifier si l'étudiant n'est pas déjà membre
      if (!club.membres.some((member) => member.userId && member.userId.equals(demande.etudiant._id))) {
        club.membres.push({
          email: demande.etudiant.email,
          role: "Membre",
          userId: demande.etudiant._id,
        })

        await club.save()
      }
    }

    res.json({
      success: true,
      message: `Demande ${statut === "acceptée" ? "acceptée" : "refusée"} avec succès`,
      demande,
    })
  } catch (error) {
    console.error("Erreur lors du traitement de la demande:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors du traitement de la demande",
    })
  }
})

// Rejoindre un club (ancienne méthode - à conserver pour compatibilité)
app.post("/api/clubs/:id/join", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)

    if (!club) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    const user = await User.findById(req.user.id)

    // Vérifier si l'utilisateur est déjà membre
    if (club.membres.some((member) => member.userId && member.userId.equals(req.user.id))) {
      return res.status(400).json({ message: "Vous êtes déjà membre de ce club" })
    }

    // Rediriger vers la nouvelle méthode de demande
    return res.status(400).json({
      message: "Veuillez utiliser la nouvelle méthode pour rejoindre un club",
      redirectTo: "/api/clubs/" + req.params.id + "/demande",
    })
  } catch (error) {
    console.error("Erreur lors de la rejointe du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Supprimer un club (réservé aux administrateurs ou au responsable du club)
app.delete("/api/clubs/:id", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)

    if (!club) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    const user = await User.findById(req.user.id)

    // Vérifier si l'utilisateur a les droits
    if (user.poste !== "administrateur" && !club.responsable.equals(req.user.id)) {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour supprimer ce club" })
    }

    // Supprimer les fichiers associés
    if (club.logo) {
      fs.unlink(club.logo, (err) => {
        if (err) console.error("Erreur lors de la suppression du logo:", err)
      })
    }

    if (club.validationDoc) {
      fs.unlink(club.validationDoc, (err) => {
        if (err) console.error("Erreur lors de la suppression du document:", err)
      })
    }

    // Supprimer toutes les demandes associées à ce club
    await DemandeClub.deleteMany({ club: club._id })

    // Supprimer le club
    await Club.findByIdAndDelete(req.params.id)

    res.json({ message: "Club supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Mettre à jour un club
app.put(
  "/api/clubs/:id",
  auth,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "validationDoc", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const club = await Club.findById(req.params.id)

      if (!club) {
        return res.status(404).json({ message: "Club non trouvé" })
      }

      const user = await User.findById(req.user.id)

      // Vérifier si l'utilisateur a les droits
      if (user.poste !== "administrateur" && !club.responsable.equals(req.user.id)) {
        return res.status(403).json({ message: "Vous n'avez pas les droits pour modifier ce club" })
      }

      const { clubName, description, activeMembers } = req.body

      // Mettre à jour les informations de base
      if (clubName) club.nom = clubName
      if (description) club.description = description

      // Gestion des fichiers
      if (req.files.logo) {
        // Supprimer l'ancien logo
        if (club.logo) {
          fs.unlink(club.logo, (err) => {
            if (err) console.error("Erreur lors de la suppression de l'ancien logo:", err)
          })
        }
        club.logo = req.files.logo[0].path
      }

      if (req.files.validationDoc) {
        // Supprimer l'ancien document
        if (club.validationDoc) {
          fs.unlink(club.validationDoc, (err) => {
            if (err) console.error("Erreur lors de la suppression de l'ancien document:", err)
          })
        }
        club.validationDoc = req.files.validationDoc[0].path
      }

      // Traitement des membres si fournis
      if (activeMembers) {
        try {
          const parsedMembers = JSON.parse(activeMembers)
          const updatedMembers = []

          // Garder le responsable comme membre
          const responsableUser = await User.findById(club.responsable)
          updatedMembers.push({
            email: responsableUser.email,
            role: "Créateur",
            userId: responsableUser._id,
          })

          // Ajouter les autres membres
          for (const member of parsedMembers) {
            // Ne pas ajouter le responsable deux fois
            if (member.email === responsableUser.email) continue

            // Vérifier si l'email est déjà utilisé par un utilisateur existant
            const existingUser = await User.findOne({ email: member.email })

            updatedMembers.push({
              email: member.email,
              role: member.role,
              userId: existingUser ? existingUser._id : null,
            })
          }

          club.membres = updatedMembers
        } catch (error) {
          console.error("Erreur lors du traitement des membres:", error)
          return res.status(400).json({ message: "Format des membres invalide" })
        }
      }

      await club.save()

      res.json({
        success: true,
        message: "Club mis à jour avec succès",
        club: {
          id: club._id,
          nom: club.nom,
          description: club.description,
          logoUrl: club.logo ? `/${club.logo}` : null,
        },
      })
    } catch (error) {
      console.error("Erreur lors de la mise à jour du club:", error)
      res.status(500).json({
        success: false,
        message: error.message || "Erreur lors de la mise à jour du club",
      })
    }
  },
)

// Quitter un club
app.post("/api/clubs/:id/leave", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)

    if (!club) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    // Vérifier si l'utilisateur est le responsable
    if (club.responsable.equals(req.user.id)) {
      return res.status(400).json({ message: "Le responsable ne peut pas quitter le club sans le transférer" })
    }

    // Vérifier si l'utilisateur est membre
    const memberIndex = club.membres.findIndex((member) => member.userId && member.userId.equals(req.user.id))

    if (memberIndex === -1) {
      return res.status(400).json({ message: "Vous n'êtes pas membre de ce club" })
    }

    // Retirer l'utilisateur des membres
    club.membres.splice(memberIndex, 1)
    await club.save()

    res.json({ message: "Vous avez quitté le club avec succès" })
  } catch (error) {
    console.error("Erreur lors du départ du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour transférer la responsabilité du club
app.post("/api/clubs/:id/transfer", auth, async (req, res) => {
  try {
    const { newResponsableEmail } = req.body

    if (!newResponsableEmail) {
      return res.status(400).json({ message: "Email du nouveau responsable requis" })
    }

    const club = await Club.findById(req.params.id)

    if (!club) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    // Vérifier si l'utilisateur est le responsable actuel
    if (!club.responsable.equals(req.user.id)) {
      return res.status(403).json({ message: "Seul le responsable actuel peut transférer la responsabilité" })
    }

    // Trouver le nouvel utilisateur responsable
    const newResponsable = await User.findOne({ email: newResponsableEmail })

    if (!newResponsable) {
      return res.status(404).json({ message: "Nouvel utilisateur responsable non trouvé" })
    }

    // Vérifier si le nouvel utilisateur est déjà membre
    const isMember = club.membres.some((member) => member.userId && member.userId.equals(newResponsable._id))

    if (!isMember) {
      // Ajouter le nouvel utilisateur aux membres
      club.membres.push({
        email: newResponsable.email,
        role: "Nouveau Responsable",
        userId: newResponsable._id,
      })
    } else {
      // Mettre à jour son rôle
      club.membres = club.membres.map((member) => {
        if (member.userId && member.userId.equals(newResponsable._id)) {
          return { ...member, role: "Nouveau Responsable" }
        }
        return member
      })
    }

    // Changer le responsable
    club.responsable = newResponsable._id

    await club.save()

    res.json({ message: "Responsabilité du club transférée avec succès" })
  } catch (error) {
    console.error("Erreur lors du transfert de responsabilité:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Route pour obtenir les statistiques
app.get("/api/stats", auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est administrateur
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    // Nombre total d'utilisateurs
    const totalUsers = await User.countDocuments()

    // Répartition des utilisateurs par poste
    const usersByRole = await User.aggregate([{ $group: { _id: "$poste", count: { $sum: 1 } } }])

    // Nombre total de clubs
    const totalClubs = await Club.countDocuments()

    // Répartition des clubs par établissement
    const clubsByInstitution = await Club.aggregate([{ $group: { _id: "$etablissement", count: { $sum: 1 } } }])

    // Top 5 des clubs avec le plus de membres
    const topClubs = await Club.aggregate([
      { $project: { nom: 1, etablissement: 1, memberCount: { $size: "$membres" } } },
      { $sort: { memberCount: -1 } },
      { $limit: 5 },
    ])

    // Statistiques sur les demandes d'adhésion
    const totalDemandes = await DemandeClub.countDocuments()
    const demandesEnAttente = await DemandeClub.countDocuments({ statut: "en_attente" })
    const demandesAcceptees = await DemandeClub.countDocuments({ statut: "acceptée" })
    const demandesRefusees = await DemandeClub.countDocuments({ statut: "refusée" })

    res.json({
      users: {
        total: totalUsers,
        byRole: usersByRole,
      },
      clubs: {
        total: totalClubs,
        byInstitution: clubsByInstitution,
        top: topClubs,
      },
      demandes: {
        total: totalDemandes,
        enAttente: demandesEnAttente,
        acceptees: demandesAcceptees,
        refusees: demandesRefusees,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les témoignages
// Créer un nouveau témoignage
app.post("/api/temoignages", auth, async (req, res) => {
  try {
    const { opinion, rating } = req.body

    // Vérifier si l'utilisateur existe
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    // Créer le nouveau témoignage
    const nouveauTemoignage = new Temoignage({
      etudiant: req.user.id,
      nom: user.nom,
      prenom: user.prenom,
      opinion,
      rating,
    })

    await nouveauTemoignage.save()

    res.status(201).json({
      success: true,
      message: "Témoignage envoyé avec succès",
      temoignage: nouveauTemoignage,
    })
  } catch (error) {
    console.error("Erreur lors de l'envoi du témoignage:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de l'envoi du témoignage",
    })
  }
})

// Récupérer tous les témoignages
app.get("/api/temoignages", async (req, res) => {
  try {
    const temoignages = await Temoignage.find().sort({ createdAt: -1 }) // Du plus récent au plus ancien

    res.json(temoignages)
  } catch (error) {
    console.error("Erreur lors de la récupération des témoignages:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Routes pour les réclamations
// Créer une nouvelle réclamation
app.post("/api/reclamations", auth, async (req, res) => {
  try {
    const { sujet, description, type } = req.body

    // Vérifier si l'utilisateur existe
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    // Créer la nouvelle réclamation
    const nouvelleReclamation = new Reclamation({
      etudiant: req.user.id,
      sujet,
      description,
      type: type || "general",
    })

    await nouvelleReclamation.save()

    res.status(201).json({
      success: true,
      message: "Réclamation envoyée avec succès",
      reclamation: nouvelleReclamation,
    })
  } catch (error) {
    console.error("Erreur lors de l'envoi de la réclamation:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de l'envoi de la réclamation",
    })
  }
})

// Récupérer les réclamations de l'utilisateur connecté
app.get("/api/reclamations", auth, async (req, res) => {
  try {
    const reclamations = await Reclamation.find({ etudiant: req.user.id }).sort({ createdAt: -1 }) // Du plus récent au plus ancien

    res.json(reclamations)
  } catch (error) {
    console.error("Erreur lors de la récupération des réclamations:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Récupérer toutes les réclamations (pour les administrateurs)
app.get("/api/admin/reclamations", auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est administrateur
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    const reclamations = await Reclamation.find().populate("etudiant", "nom prenom email").sort({ createdAt: -1 })

    res.json(reclamations)
  } catch (error) {
    console.error("Erreur lors de la récupération des réclamations:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Répondre à une réclamation (pour les administrateurs)
app.put("/api/reclamations/:id", auth, async (req, res) => {
  try {
    const { statut, reponse } = req.body

    // Vérifier si l'utilisateur est administrateur
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    // Vérifier si la réclamation existe
    const reclamation = await Reclamation.findById(req.params.id)
    if (!reclamation) {
      return res.status(404).json({ message: "Réclamation non trouvée" })
    }

    // Mettre à jour la réclamation
    reclamation.statut = statut || reclamation.statut
    if (reponse) {
      reclamation.reponse = reponse
    }

    await reclamation.save()

    res.json({
      success: true,
      message: "Réclamation mise à jour avec succès",
      reclamation,
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la réclamation:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de la mise à jour de la réclamation",
    })
  }
})

// Gestion des erreurs pour multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Fichier trop volumineux. Maximum 2MB pour les logos et 10MB pour les documents.",
      })
    }
    return res.status(400).json({ message: err.message })
  } else if (err) {
    return res.status(500).json({ message: err.message })
  }
  next()
})

// Schema for Events
const eventSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: { type: String, required: true },
  lieu: { type: String, required: true },
  date: { type: Date, required: true },
  heureDebut: { type: String, required: true },
  heureFin: { type: String, required: true },
  capaciteMax: { type: Number, required: true },
  type: { type: String, enum: ["présentiel", "en ligne"], default: "présentiel" },
  lienVisio: { type: String },
  image: { type: String },
  club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
})

const Event = mongoose.model("Event", eventSchema)

// Schema for Equipment
const equipmentSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  quantite: { type: Number, required: true },
  etat: { type: String, enum: ["disponible", "indisponible"], default: "disponible" },
  image: { type: String },
  club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
  createdAt: { type: Date, default: Date.now },
})

const Equipment = mongoose.model("Equipment", equipmentSchema)

// Schema for Reservations
const reservationSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: { type: String, required: true },
  lieu: { type: String, required: true },
  date: { type: Date, required: true },
  heureDebut: { type: String, required: true },
  heureFin: { type: String, required: true },
  statut: { type: String, enum: ["en_attente", "approuvée", "refusée"], default: "en_attente" },
  club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  equipements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Equipment" }],
  createdAt: { type: Date, default: Date.now },
})

const Reservation = mongoose.model("Reservation", reservationSchema)

// Update the route for processing club membership requests to change user status
app.put("/api/demandes/:id", auth, async (req, res) => {
  try {
    const { statut } = req.body

    if (!statut || !["acceptée", "refusée"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const demande = await DemandeClub.findById(req.params.id).populate("club").populate("etudiant")

    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée" })
    }

    const user = await User.findById(req.user.id)

    // Vérifier les droits d'accès
    if (user.poste !== "administrateur" && (!demande.club.responsable || !demande.club.responsable.equals(user._id))) {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour traiter cette demande" })
    }

    // Mettre à jour le statut de la demande
    demande.statut = statut
    await demande.save()

    // Si la demande est acceptée, ajouter l'étudiant comme membre du club
    if (statut === "acceptée") {
      const club = await Club.findById(demande.club._id)
      const etudiant = await User.findById(demande.etudiant._id)

      // Vérifier si l'étudiant n'est pas déjà membre
      if (!club.membres.some((member) => member.userId && member.userId.equals(demande.etudiant._id))) {
        club.membres.push({
          email: demande.etudiant.email,
          role: "Membre",
          userId: demande.etudiant._id,
        })

        await club.save()
      }

      // Mettre à jour le statut de l'utilisateur à "etudiant" s'il ne l'est pas déjà
      if (etudiant && etudiant.poste !== "etudiant") {
        etudiant.poste = "etudiant"
        await etudiant.save()
      }
    }

    res.json({
      success: true,
      message: `Demande ${statut === "acceptée" ? "acceptée" : "refusée"} avec succès`,
      demande,
    })
  } catch (error) {
    console.error("Erreur lors du traitement de la demande:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors du traitement de la demande",
    })
  }
})

// Get admin dashboard statistics
app.get("/api/admin/stats", auth, async (req, res) => {
  try {
    // Verify admin role
    const user = await User.findById(req.user.id)
    if (user.poste !== "administrateur") {
      return res.status(403).json({ message: "Accès non autorisé" })
    }

    const timeRange = req.query.timeRange || "week"
    let dateFilter = {}

    // Calculate date range
    const now = new Date()
    if (timeRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFilter = { createdAt: { $gte: weekAgo } }
    } else if (timeRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFilter = { createdAt: { $gte: monthAgo } }
    } else if (timeRange === "year") {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      dateFilter = { createdAt: { $gte: yearAgo } }
    }

    // Get counts
    const totalUsers = await User.countDocuments()
    const totalClubs = await Club.countDocuments()
    const totalEvents = await Event.countDocuments()
    const totalComplaints = await Reclamation.countDocuments()
    const totalTestimonials = await Temoignage.countDocuments()

    // Get pending requests
    const pendingClubRequests = await Club.countDocuments({ statutValidation: "en_attente" })
    const pendingMemberRequests = await DemandeClub.countDocuments({ statut: "en_attente" })

    // Get recent users and clubs
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5)
    const recentClubs = await Club.find().sort({ dateCreation: -1 }).limit(5)

    // Get user distribution
    const usersByRole = {
      etudiant: await User.countDocuments({ poste: "etudiant" }),
      responsable: await User.countDocuments({ poste: "responsable" }),
      administrateur: await User.countDocuments({ poste: "administrateur" }),
    }

    // Get club distribution
    const clubsByStatus = {
      active: await Club.countDocuments({ statutValidation: "validé" }),
      inactive: await Club.countDocuments({ statutValidation: "refusé" }),
      pending: await Club.countDocuments({ statutValidation: "en_attente" }),
    }

    // Calculate change percentages (simplified placeholders)
    const userChange = 5.2
    const clubChange = 3.8
    const eventChange = -1.5

    res.json({
      totalUsers,
      totalClubs,
      totalEvents,
      totalComplaints,
      totalTestimonials,
      pendingClubRequests,
      pendingMemberRequests,
      recentUsers,
      recentClubs,
      usersByRole,
      clubsByStatus,
      userChange,
      clubChange,
      eventChange,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir tous les événements
app.get("/api/events", auth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate("club", "nom etablissement")
      .populate("createdBy", "nom prenom email")
      .sort({ date: 1 })
    res.json(events)
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir les événements d'un club spécifique
app.get("/api/events/club/:id", auth, async (req, res) => {
  try {
    const events = await Event.find({ club: req.params.id }).populate("createdBy", "nom prenom email").sort({ date: 1 })
    res.json(events)
  } catch (error) {
    console.error("Erreur lors de la récupération des événements du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir un événement spécifique
app.get("/api/events/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("club", "nom etablissement")
      .populate("createdBy", "nom prenom email")
      .populate("participants", "nom prenom email")

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" })
    }

    res.json(event)
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Créer un nouvel événement
app.post("/api/events", auth, upload.single("image"), async (req, res) => {
  try {
    const { titre, description, lieu, date, heureDebut, heureFin, capaciteMax, type, lienVisio, club } = req.body

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const clubObj = await Club.findById(club)

    if (!clubObj) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    // Vérifier si l'utilisateur est le responsable du club ou un créateur
    const isResponsable = clubObj.responsable && clubObj.responsable.equals(req.user.id)
    const isCreator = clubObj.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )

    if (!isResponsable && !isCreator && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour créer un événement pour ce club" })
    }

    const newEvent = new Event({
      titre,
      description,
      lieu,
      date,
      heureDebut,
      heureFin,
      capaciteMax,
      type: type || "présentiel",
      lienVisio: type === "en ligne" ? lienVisio : null,
      club,
      createdBy: req.user.id,
      image: req.file ? req.file.path : null,
    })

    await newEvent.save()
    res.status(201).json(newEvent)
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Mettre à jour un événement
app.put("/api/events/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { titre, description, lieu, date, heureDebut, heureFin, capaciteMax, type, lienVisio } = req.body

    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" })
    }

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const club = await Club.findById(event.club)

    const isResponsable = club.responsable && club.responsable.equals(req.user.id)
    const isCreator = club.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )
    const isEventCreator = event.createdBy && event.createdBy.equals(req.user.id)

    if (!isResponsable && !isCreator && !isEventCreator && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour modifier cet événement" })
    }

    // Mettre à jour les champs
    if (titre) event.titre = titre
    if (description) event.description = description
    if (lieu) event.lieu = lieu
    if (date) event.date = date
    if (heureDebut) event.heureDebut = heureDebut
    if (heureFin) event.heureFin = heureFin
    if (capaciteMax) event.capaciteMax = capaciteMax
    if (type) {
      event.type = type
      if (type === "en ligne" && lienVisio) {
        event.lienVisio = lienVisio
      } else {
        event.lienVisio = null
      }
    }

    // Gérer l'image
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (event.image) {
        fs.unlink(event.image, (err) => {
          if (err) console.error("Erreur lors de la suppression de l'ancienne image:", err)
        })
      }
      event.image = req.file.path
    }

    await event.save()
    res.json(event)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'événement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Supprimer un événement
app.delete("/api/events/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" })
    }

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const club = await Club.findById(event.club)

    const isResponsable = club.responsable && club.responsable.equals(req.user.id)
    const isCreator = club.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )
    const isEventCreator = event.createdBy && event.createdBy.equals(req.user.id)

    if (!isResponsable && !isCreator && !isEventCreator && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour supprimer cet événement" })
    }

    // Supprimer l'image si elle existe
    if (event.image) {
      fs.unlink(event.image, (err) => {
        if (err) console.error("Erreur lors de la suppression de l'image:", err)
      })
    }

    await Event.findByIdAndDelete(req.params.id)
    res.json({ message: "Événement supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== ROUTES POUR LES ÉQUIPEMENTS ====================
// Obtenir tous les équipements
app.get("/api/equipements", auth, async (req, res) => {
  try {
    const equipments = await Equipment.find().populate("club", "nom etablissement")
    res.json(equipments)
  } catch (error) {
    console.error("Erreur lors de la récupération des équipements:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir les équipements d'un club spécifique
app.get("/api/equipements/club/:id", auth, async (req, res) => {
  try {
    const equipments = await Equipment.find({ club: req.params.id })
    res.json(equipments)
  } catch (error) {
    console.error("Erreur lors de la récupération des équipements du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir un équipement spécifique
app.get("/api/equipements/:id", auth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id).populate("club", "nom etablissement")

    if (!equipment) {
      return res.status(404).json({ message: "Équipement non trouvé" })
    }

    res.json(equipment)
  } catch (error) {
    console.error("Erreur lors de la récupération de l'équipement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Créer un nouvel équipement
app.post("/api/equipements", auth, upload.single("image"), async (req, res) => {
  try {
    const { nom, description, quantite, etat, club } = req.body

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const clubObj = await Club.findById(club)

    if (!clubObj) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    // Vérifier si l'utilisateur est le responsable du club ou un créateur
    const isResponsable = clubObj.responsable && clubObj.responsable.equals(req.user.id)
    const isCreator = clubObj.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )

    if (!isResponsable && !isCreator && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour ajouter un équipement à ce club" })
    }

    const newEquipment = new Equipment({
      nom,
      description,
      quantite,
      etat: etat || "disponible",
      club,
      image: req.file ? req.file.path : null,
    })

    await newEquipment.save()
    res.status(201).json(newEquipment)
  } catch (error) {
    console.error("Erreur lors de la création de l'équipement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Mettre à jour un équipement
app.put("/api/equipements/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { nom, description, quantite, etat } = req.body

    const equipment = await Equipment.findById(req.params.id)
    if (!equipment) {
      return res.status(404).json({ message: "Équipement non trouvé" })
    }

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const club = await Club.findById(equipment.club)

    const isResponsable = club.responsable && club.responsable.equals(req.user.id)
    const isCreator = club.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )

    if (!isResponsable && !isCreator && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour modifier cet équipement" })
    }

    // Mettre à jour les champs
    if (nom) equipment.nom = nom
    if (description) equipment.description = description
    if (quantite) equipment.quantite = quantite
    if (etat) equipment.etat = etat

    // Gérer l'image
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (equipment.image) {
        fs.unlink(equipment.image, (err) => {
          if (err) console.error("Erreur lors de la suppression de l'ancienne image:", err)
        })
      }
      equipment.image = req.file.path
    }

    await equipment.save()
    res.json(equipment)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'équipement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Supprimer un équipement
app.delete("/api/equipements/:id", auth, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
    if (!equipment) {
      return res.status(404).json({ message: "Équipement non trouvé" })
    }

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const club = await Club.findById(equipment.club)

    const isResponsable = club.responsable && club.responsable.equals(req.user.id)
    const isCreator = club.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )

    if (!isResponsable && !isCreator && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour supprimer cet équipement" })
    }

    // Supprimer l'image si elle existe
    if (equipment.image) {
      fs.unlink(equipment.image, (err) => {
        if (err) console.error("Erreur lors de la suppression de l'image:", err)
      })
    }

    await Equipment.findByIdAndDelete(req.params.id)
    res.json({ message: "Équipement supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'équipement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// ==================== ROUTES POUR LES RÉSERVATIONS ====================
// Obtenir toutes les réservations
app.get("/api/reservations", auth, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("club", "nom etablissement")
      .populate("createdBy", "nom prenom email")
      .populate("equipements")
      .sort({ date: 1 })
    res.json(reservations)
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir les réservations d'un club spécifique
app.get("/api/reservations/club/:id", auth, async (req, res) => {
  try {
    const reservations = await Reservation.find({ club: req.params.id })
      .populate("createdBy", "nom prenom email")
      .populate("equipements")
      .sort({ date: 1 })
    res.json(reservations)
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Obtenir une réservation spécifique
app.get("/api/reservations/:id", auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("club", "nom etablissement")
      .populate("createdBy", "nom prenom email")
      .populate("equipements")

    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" })
    }

    res.json(reservation)
  } catch (error) {
    console.error("Erreur lors de la récupération de la réservation:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Créer une nouvelle réservation
app.post("/api/reservations", auth, async (req, res) => {
  try {
    const { titre, description, lieu, date, heureDebut, heureFin, equipements, club } = req.body

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const clubObj = await Club.findById(club)

    if (!clubObj) {
      return res.status(404).json({ message: "Club non trouvé" })
    }

    // Vérifier si l'utilisateur est le responsable du club ou un créateur
    const isResponsable = clubObj.responsable && clubObj.responsable.equals(req.user.id)
    const isCreator = clubObj.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )
    const isMember = clubObj.membres.some((member) => member.userId && member.userId.equals(req.user.id))

    if (!isResponsable && !isCreator && !isMember && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour créer une réservation pour ce club" })
    }

    const newReservation = new Reservation({
      titre,
      description,
      lieu,
      date,
      heureDebut,
      heureFin,
      club,
      createdBy: req.user.id,
      equipements: equipements || [],
    })

    await newReservation.save()

    // Populate the equipements for the response
    const populatedReservation = await Reservation.findById(newReservation._id).populate("equipements")

    res.status(201).json(populatedReservation)
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Mettre à jour une réservation
app.put("/api/reservations/:id", auth, async (req, res) => {
  try {
    const { titre, description, lieu, date, heureDebut, heureFin, equipements } = req.body

    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" })
    }

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const club = await Club.findById(reservation.club)

    const isResponsable = club.responsable && club.responsable.equals(req.user.id)
    const isCreator = club.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )
    const isReservationCreator = reservation.createdBy && reservation.createdBy.equals(req.user.id)

    if (!isResponsable && !isCreator && !isReservationCreator && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour modifier cette réservation" })
    }

    // Mettre à jour les champs
    if (titre) reservation.titre = titre
    if (description) reservation.description = description
    if (lieu) reservation.lieu = lieu
    if (date) reservation.date = date
    if (heureDebut) reservation.heureDebut = heureDebut
    if (heureFin) reservation.heureFin = heureFin
    if (equipements) reservation.equipements = equipements

    await reservation.save()

    // Populate the equipements for the response
    const populatedReservation = await Reservation.findById(reservation._id).populate("equipements")

    res.json(populatedReservation)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la réservation:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Mettre à jour le statut d'une réservation
app.put("/api/reservations/:id/status", auth, async (req, res) => {
  try {
    const { statut } = req.body

    if (!statut || !["en_attente", "approuvée", "refusée"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide" })
    }

    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" })
    }

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const club = await Club.findById(reservation.club)

    const isResponsable = club.responsable && club.responsable.equals(req.user.id)
    const isCreator = club.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )

    if (!isResponsable && !isCreator && user.poste !== "administrateur") {
      return res
        .status(403)
        .json({ message: "Vous n'avez pas les droits pour modifier le statut de cette réservation" })
    }

    reservation.statut = statut
    await reservation.save()

    res.json(reservation)
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la réservation:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Supprimer une réservation
app.delete("/api/reservations/:id", auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" })
    }

    // Vérifier si l'utilisateur a les droits
    const user = await User.findById(req.user.id)
    const club = await Club.findById(reservation.club)

    const isResponsable = club.responsable && club.responsable.equals(req.user.id)
    const isCreator = club.membres.some(
      (member) => member.userId && member.userId.equals(req.user.id) && member.role === "Créateur",
    )
    const isReservationCreator = reservation.createdBy && reservation.createdBy.equals(req.user.id)

    if (!isResponsable && !isCreator && !isReservationCreator && user.poste !== "administrateur") {
      return res.status(403).json({ message: "Vous n'avez pas les droits pour supprimer cette réservation" })
    }

    await Reservation.findByIdAndDelete(req.params.id)
    res.json({ message: "Réservation supprimée avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression de la réservation:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Démarrage du serveur
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`))


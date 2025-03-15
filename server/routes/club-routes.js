const express = require("express")
const router = express.Router()
const Club = require("../models/Club") // Adjust path as needed
const auth = require("../middleware/auth") // Adjust path as needed
const User = require("../models/User") // Import User model
const fs = require("fs") // Import fs module

// Get all clubs
router.get("/", async (req, res) => {
  try {
    const clubs = await Club.find().populate("responsable", "nom prenom")
    res.json(clubs)
  } catch (error) {
    console.error("Erreur lors de la récupération des clubs:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Get a specific club
router.get("/:id", async (req, res) => {
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

// IMPORTANT: Add the approve and reject routes here
// Approve a club
router.put("/:id/approve", auth, async (req, res) => {
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
    }

    await club.save()

    // If a responsable was set, update their poste to "responsable"
    if (club.responsable) {
      await User.findByIdAndUpdate(club.responsable, { poste: "responsable" })
    }

    // NOUVEAU: Mettre à jour toutes les demandes associées à ce club
    const DemandeClub = require("../models/DemandeClub") // Assurez-vous d'importer le modèle
    await DemandeClub.updateMany({ club: club._id, statut: "en_attente" }, { $set: { statut: "acceptée" } })

    res.json({ message: "Club approuvé avec succès", club })
  } catch (error) {
    console.error("Error approving club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

// Reject a club
router.put("/:id/reject", auth, async (req, res) => {
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

// Delete a club
router.delete("/:id", auth, async (req, res) => {
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

    // Supprimer le club
    await Club.findByIdAndDelete(req.params.id)

    res.json({ message: "Club supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression du club:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

module.exports = router


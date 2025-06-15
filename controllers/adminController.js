import { query } from "../config/db.js";
import CourseModel from "../models/Course.js";
import bcrypt from "bcryptjs";
import UserModel from "../models/userModel.js"; 
import {
addUserSchema,
changePasswordSchema
} from "../utils/validation.js";
import { isAdmin, isInstructor, isStudent } from "../middleware/roleMiddleware.js";
const AdminController = {
  async addUser(req, res, next) {
    try {
      // Validate request body
      const { error, value } = addUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Use validated values
      const { name, email, password, role } = value;

      if (!['instructor', 'student'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role. Must be 'instructor' or 'student'",
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: "Email already exists" });
      }

      const password_hash = await bcrypt.hash(password, 12);
      const newUser = await UserModel.create({ name, email, password, role });

      if (process.env.SEND_WELCOME_EMAIL === 'true') {
        await sendWelcomeEmail(email, name, role);
      }

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { name, email, role, is_active, newPassword, currentPassword, confirmPassword } = req.body;

      if (role && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Only admin can modify roles"
        });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      if (role && !['instructor', 'student'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role. Must be 'instructor' or 'student'"
        });
      }

      if (email && email !== user.email) {
        const emailExists = await UserModel.findByEmail(email);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            error: "Email already in use by another user"
          });
        }
      }

      if (user.role === 'admin' && req.user.id !== user.id) {
        return res.status(403).json({
          success: false,
          error: "Cannot modify other admin accounts"
        });
      }

      const updateData = {
        name: name || user.name,
        email: email || user.email,
        role: (req.user.role === 'admin') ? (role || user.role) : user.role,
        is_active: is_active !== undefined ? is_active : user.is_active
      };

      // Handle password change if newPassword is provided
      if (newPassword) {
        // Validate the password change fields using changePasswordSchema
        const { error } = changePasswordSchema.validate({
          currentPassword,
          newPassword,
          confirmPassword
        });
        if (error) {
          return res.status(400).json({
            success: false,
            error: error.details[0].message
          });
        }

        if (!user.password) {
          // No password set, allow setting new password without current password check
          updateData.password = await bcrypt.hash(newPassword, 12);
        } else {
          // Check current password
          if (!currentPassword) {
            return res.status(400).json({
              success: false,
              error: "Current password is missing from request"
            });
          }
          const passwordMatch = await bcrypt.compare(currentPassword, user.password);
          if (!passwordMatch) {
            return res.status(400).json({
              success: false,
              error: "Current password is incorrect"
            });
          }
          updateData.password = await bcrypt.hash(newPassword, 12);
        }
      }

      const updatedUser = await UserModel.update(userId, updateData);

      res.json({
        success: true,
        user: updatedUser
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      if (user.is_super_admin) {
        return res.status(403).json({
          success: false,
          error: "Cannot delete super admin"
        });
      }

      await UserModel.delete(userId);
      res.json({
        success: true,
        message: "User deleted successfully"
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  // Get user by ID
  async getUserById(req, res, next) {
    try {
      const { userId } = req.params;
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      // Only admin can access
      if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, error: "Access denied: only admins can perform this action" });
      }
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get user by email
  async getUserByEmail(req, res, next) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      // Only admin can access
      if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, error: "Access denied: only admins can perform this action" });
      }
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get all users - only admin can get all users (including admins)
  async getAllUsers(req, res, next) {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, error: "Access denied: only admins can perform this action" });
      }
      const users = await UserModel.getAll();
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  async approveCourse(req, res, next) {
    try {
      const { courseId } = req.params;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, error: "Course not found" });
      }

      await CourseModel.updateStatus(courseId, 'published');

      res.json({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          status: 'published'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async rejectCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const { feedback } = req.body;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, error: "Course not found" });
      }

      // Update course status and feedback
      await CourseModel.updateStatus(courseId, 'rejected', feedback);

      res.json({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          status: 'rejected',
          feedback: feedback || null,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getPendingCourses(req, res, next) {
    try {
      const courses = await CourseModel.findAll({ status: 'pending' });
      res.json({ success: true, courses });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

export default AdminController;
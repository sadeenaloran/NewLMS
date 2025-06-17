import CourseModel from "../models/Course.js";
import ModuleModel from "../models/Module.js";
import { courseSchema, courseUpdateSchema } from "../utils/courseValidation.js";

const CourseController = {
  async createCourse(req, res, next) {
    try {
      const { error, value } = courseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
      const { title, description, category_id, duration } = req.body;

      // استخدام صورة افتراضية مؤقتًا
      const thumbnail_url = "https://via.placeholder.com/800x450";

      const course = await CourseModel.create({
        title,
        description,
        instructor_id: req.user.id,
        category_id,
        thumbnail_url,
        duration,
        status: "pending",
      });

      res.status(201).json({ success: true, course });
    } catch (error) {
      next(error);
    }
  },

  async updateCourse(req, res, next) {
    try {
      const course = await CourseModel.findById(req.params.id);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
      if (req.user.role !== "admin" && course.instructor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You can only edit your own courses",
        });
      }

      const { error, value } = courseUpdateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const updates = {
        title: req.body.title,
        description: req.body.description,
        category_id: req.body.category_id,
        duration: req.body.duration,
        status: "pending",
      };

      // الاحتفاظ بالصورة الحالية إذا لم يتم توفير جديدة
      updates.thumbnail_url = course.thumbnail_url;

      const updatedCourse = await CourseModel.update(req.params.id, updates);
      res.json({ success: true, course: updatedCourse });
    } catch (error) {
      next(error);
    }
  },
  // async createCourse(req, res, next) {
  //   try {
  //     const { title, description, category_id, thumbnail_url, duration } =
  //       req.body;

  //     const course = await CourseModel.create({
  //       title,
  //       description,
  //       instructor_id: req.user.id,
  //       category_id,
  //       thumbnail_url,
  //       duration,
  //     });

  //     res.status(201).json({ success: true, course });
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  async getAllCourses(req, res, next) {
    try {
      let courses;

      if (!req.user) {
        // Public users (not logged in) only see approved coursess
        courses = await CourseModel.findByStatus("approved");
      } else if (req.user.role === "student") {
        // Students see only approved courses
        courses = await CourseModel.findByStatus("approved");
      } else if (req.user.role === "admin" || req.user.role === "instructor") {
        // Admins and instructors see all courses
        courses = await CourseModel.findAll();
      } else {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      }

      res.json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  },

  async getCourseDetails(req, res, next) {
    try {
      const course = await CourseModel.findById(req.params.id);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      const modules = await ModuleModel.findByCourseId(req.params.id);
      res.json({ success: true, data: { ...course, modules } });
    } catch (error) {
      next(error);
    }
  },

  // async updateCourse(req, res, next) {
  //   try {
  //     const course = await CourseModel.findById(req.params.id);
  //     if (!course) {
  //       return res
  //         .status(404)
  //         .json({ success: false, message: "Course not found" });
  //     }

  //     if (req.user.role !== "admin" && course.instructor_id !== req.user.id) {
  //       return res.status(403).json({
  //         success: false,
  //         message: "Unauthorized: You can only edit your own courses",
  //       });
  //     }

  //     const updates = {
  //       title: req.body.title,
  //       description: req.body.description,
  //       category_id: req.body.category_id,
  //       thumbnail_url: req.body.thumbnail_url,
  //       duration: req.body.duration,
  //     };

  //     if (req.user.role === "admin" && req.body.status) {
  //       updates.status = req.body.status;
  //       updates.feedback = req.body.feedback;
  //     }

  //     const updatedCourse = await CourseModel.update(req.params.id, updates);
  //     res.json({ success: true, course: updatedCourse });
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  async deleteCourse(req, res, next) {
    try {
      await CourseModel.delete(req.params.id);
      res.json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  async approveCourse(req, res, next) {
    try {
      const course = await CourseModel.updateStatus(
        req.params.id,
        "approved",
        req.body.feedback
      );
      res.json({ success: true, course });
    } catch (error) {
      next(error);
    }
  },

  async rejectCourse(req, res, next) {
    try {
      const course = await CourseModel.updateStatus(
        req.params.id,
        "rejected",
        req.body.feedback
      );
      res.json({ success: true, course });
    } catch (error) {
      next(error);
    }
  },
};

export default CourseController;

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const Admincheck = asyncHandler(async (req, res, next) => {

    try {

        const user = await User.findById(req.user?._id)

        if (!user) {
            throw new ApiError(401, "Unauthorized Access")
        }

        if (!(user.role === "Admin")) {
            throw new ApiError(400, "Logged in user is not the app admin")
        }

        next()
    } catch (error) {
        throw new ApiError(500, error?.message)
    }
})
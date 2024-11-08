//Imports
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { generateToken, checkToken } from "../utils/tokenizer.js";
import jwt from "jsonwebtoken";
import { emailer } from "../utils/emailer.js";


const generateTokens = async function (user) {
    //we have passed the user here to avoid making another database call

    try {
        const accessToken = user.generateAccessToken()

        await user.save({ validateBeforeSave: false })
        return { accessToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong on our end")
    }

}

const cookieOptions = {
    httpOnly: true,
    secure: false
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, password, profile } = req.body


    //check that required fields are not empty 
    if (!(fullname && email && password)) {
        throw new ApiError(400, "All fields are required")
    }

    if (!email.includes('@')) {
        throw new ApiError(400, "Enter valid email")
    }

    //db query for existing user
    const existingUser = await User.findOne({
        email: email,
    })

    if (existingUser) {
        throw new ApiError(409, "Email already taken")
    }

    const user = await User.create({
        fullname,
        email,
        password,
        profile,
    })

    //Now we send data of the newly created use but excluding the password and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password"
    )
    if (!createdUser) {
        throw new ApiError(500, "Unable to create the user")
    }

    //Now we will send a proper built response using the ApiResponse class to serve a uniform response every time 
    return res.status(201).json(
        new ApiResponse(200, "User created successfully", createdUser)
    )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email) {
        throw new ApiError(401, "Email is required")
    }

    let user = await User.findOne({
        email: email,
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (!user.isActive) {
        throw new ApiError(401, "User is not active")
    }

    const checkPass = await user.isPasswordCorrect(password)

    if (!checkPass) {
        throw new ApiError(401, "Re-check the credentials")
    }

    //Now we will generate the Acc and Ref tokens and send the Acc and Ref back to user
    const { accessToken } = await generateTokens(user)

    const loggedInUser = await User.findById(user._id).select("-password")

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                "Logged in successfully",
                {
                    user: loggedInUser, accessToken,
                }
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {

    //JWT authentication middleware is applied in routes to add a req.user
    const loggedOutUser = await User.findByIdAndUpdate(req.user._id, {

    },
        {
            new: true,
            select: "-password" //Un-selects the password on new object fetch
        }
    )

    // Then we also delete the cookies to properly logout the user
    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .json(new ApiResponse(
            200, "Logged out successfully", loggedOutUser
        ))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {                                         //This check isnt necessary
        throw new ApiError(400, "Unable to find user")
    }

    return res.status(200)
        .json(new ApiResponse(
            200,
            "User found",
            req.user
        ))
})

//For Admin only 
const getAllUsers = asyncHandler(async (req, res) => {
    const allUsers = await User.find().select("-password")

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Users fetched successfully",
                allUsers
            )
        )
})

const renderProfilePage = asyncHandler(async (req, res) => {
    const loggedInUser = `
        Name of the user: ${req.user.fullname}
        Email of the user: ${req.user.email}
        Profile of the user: ${req.user.profile}
        Role of the user: ${req.user.role}
        Active status of the user: ${req.user.isActive}
    `;

    // If user is Admin, fetch all users and format them
    if (req.user.role === 'Admin') {
        const allUsers = await User.find().select("email profile role isActive");

        // Format each user as a string similar to loggedInUser
        const allUsersFormatted = allUsers.map(user => `
            Email of the user: ${user.email}
            Profile of the user: ${user.profile}
            Role of the user: ${user.role}
            Active status of the user: ${user.isActive}
        `);

        // Send the formatted data as a string
        return res.render('profile', { user: loggedInUser, role: req.user.role, data: allUsersFormatted });
    }

    // If user is not Admin, render their own profile data
    return res.render('profile', { user: loggedInUser, role: req.user.role, data: [] });
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({ email }).select("-password")

    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const tokeData = {
        userId: user._id,
        email: user.email
    }

    const resetToken = generateToken(tokeData)
    const emailContent = `
    <h1>To set a new password click the button below</h1>
    <br>
    <h2>The link will be valid for 1 day</h2>
    <br>
    <a href="${process.env.API_URL}:${process.env.PORT}/api/users/new-password?token=${resetToken}">Click Here</a>
    `;
    const emailSubject = "Set a new password";
    const emailSent = await emailer(user.email, emailSubject, emailContent)

    if (emailSent) {
        // Email sent successfully
        return res.status(200).json(new ApiResponse(200, "Email sent successfully", null));
    } else {
        // Failed to send email
        throw new ApiError(500, "Something happened on our end while sending the email");
    }

})

const newPassword = asyncHandler(async (req, res) => {
    const { password } = req.body
    const user = await User.findById(req.tokenData.userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }
    user.password = password
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const userActivationToggle = asyncHandler(async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(401, "User not found")
    }
    let status = "Activated"
    user.isActive = !user.isActive
    if (!user.isActive) {
        status = "Deactivated"
    }
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, {}, `User ${status} successfully`))
})


export { registerUser, loginUser, logoutUser, getCurrentUser, getAllUsers, changeCurrentPassword, forgotPassword, newPassword, userActivationToggle, renderProfilePage }
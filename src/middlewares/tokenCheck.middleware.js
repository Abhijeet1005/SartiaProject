import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { checkToken } from "../utils/tokenizer.js";

const tokenCheckMiddleware = asyncHandler(async (req, res, next) => {

    const { token } = req.query

    const decodedToken = checkToken(token)

    if (!decodedToken) {
        throw new ApiError(400, "Invalid authentication token")
    }

    req.tokenData = decodedToken
    next()
})

export { tokenCheckMiddleware }
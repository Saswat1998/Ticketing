import express from 'express';
import 'express-async-errors';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { RequestValidationError } from '../errors/request-validation-error';
import { User } from '../models/user';
import { BadRequestError } from '../errors/bad-request-error';
const router = express.Router();


router.post('/api/users/signup', [
    body('email')
    .isEmail()
    .withMessage("Must be a valid Email Id"),
    body('password')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage("Passord must be between 4 and 20 characters in length")
], async(req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        throw new RequestValidationError(errors.array());
    }
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if(existingUser) {
        console.log("User already exists!");
        throw new BadRequestError("User already exists!");
    }
    const user = User.build({ email, password});
    await user.save();
    const userJwt = jwt.sign({
        id: user._id,
        email: user.email
    }, process.env.JWT_KEY!);
    req.session = {
        jwt: userJwt
    };
    res.status(201).send(user);
});

export { router as signupRouter };
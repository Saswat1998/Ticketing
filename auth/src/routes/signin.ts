import express, { Request, Response } from "express";
const router = express.Router();
import { body, validationResult } from "express-validator";
import { RequestValidationError } from "../errors/request-validation-error";
import { User } from "../models/user";
import { BadRequestError } from "../errors/bad-request-error";
import { Password } from '../utils/password';
import jwt from 'jsonwebtoken';

router.post("/api/users/signin", [
    body('email')
      .isEmail()
      .withMessage('Email must be valid'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('You must supply a password')  
], async(req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        throw new RequestValidationError(errors.array());
    }
    const { email, password} = req.body;
    const existingUser = await User.findOne({ email });
    if(!existingUser) {
        throw new BadRequestError('Invalid Credentials!');
    }
    const passwordMatch = await Password.comparePasswords(existingUser.password, password);
    if(!passwordMatch) {
        throw new BadRequestError('Invalid Credentials!');
    }
    const userJwt = jwt.sign({
        id: existingUser._id,
        email: existingUser.email
    }, process.env.JWT_KEY!);
    req.session = {
        jwt: userJwt
    };
    res.status(200).send(existingUser);
});

export { router as signinRouter };
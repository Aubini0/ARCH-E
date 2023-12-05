import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import { upload, s3 } from "../db/bucketUploadClient.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { sendOTP } from "../utils/helpers/generateOTP.js"
import speakeasy from "speakeasy";


dotenv.config();

const getUserProfile = async(req, res) => {
    const { query } = req.params;

    try {
        let user;
        if (mongoose.Types.ObjectId.isValid(query)) {
            user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
        } else {
            user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
        }

        if (!user) return res.status(404).json({ error: "User not found" });

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Error in getUserProfile: ", err.message);
    }
};

const signupUser = async(req, res) => {
    try {
        const { name, email, username, password } = req.body;
        const user = await User.findOne({ $or: [{ email }, { username }] });

        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            username,
            password: hashedPassword,
        });
        await newUser.save();

        if (newUser) {
            const token = await generateTokenAndSetCookie(newUser, res);

            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                bio: newUser.bio,
                profilePic: newUser.profilePic,
                token
            });
        } else {
            res.status(400).json({ error: "Invalid user data" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Error in signupUser: ", err.message);
    }
};

const signupUserBabbl = async(req, res) => {
    try {
        const { first_name, last_name, username, age, phone, profilePic } = req.body;
        const user = await User.findOne({ $or: [{ phone }, { username }] });

        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        if (profilePic) {
            let buf = Buffer.from(profilePic.replace(/^data:image\/\w+;base64,/, ""), 'base64')

            let fileName = uuidv4();

            const type = profilePic.split(';')[0].split('/')[1];

            let params_data = {
                Key: `${fileName.substr(fileName.length - 15)}.${type}`,
                Body: buf,
                ContentEncoding: 'base64',
                ContentType: `image/${type}`,
                Bucket: "amplifibucketfiles",
                ACL: "public-read"
            };

            const { Location, Key } = await s3.upload(params_data).promise();
            let location = Location;
            let key = Key;
            const newUser = new User({
                first_name: first_name,
                last_name: last_name,
                username: username,
                age: age,
                phone: phone,
                profilePic: location,
                ip: req.ip,
            });
            await newUser.save();

            if (newUser) {
                const token = await generateTokenAndSetCookie(newUser, res);

                res.status(201).json({
                    _id: newUser._id,
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    username: newUser.username,
                    age: newUser.age,
                    profilePic: newUser.profilePic,
                    ip: user.ip,
                    token: token
                });
            } else {
                res.status(400).json({ error: "Invalid user data" });
            }
        } else {
            let location = null;
            let key = null;
            const newUser = new User({
                first_name: first_name,
                last_name: last_name,
                username: username,
                age: age,
                phone: phone,
                profilePic: location,
                ip: req.ip,
            });
            await newUser.save();

            if (newUser) {
                const token = await generateTokenAndSetCookie(newUser, res);

                res.status(201).json({
                    _id: newUser._id,
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    username: newUser.username,
                    age: newUser.age,
                    profilePic: newUser.profilePic,
                    ip: newUser.ip,
                    token: token
                });
            } else {
                res.status(400).json({ error: "Invalid user data" });
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Error in signupUser: ", err.message);
    }
};


const loginUser = async(req, res) => {
    try {
        console.log(req.body);
        const { username, password } = req.body;
        console.log(username, password);
        const user = await User.findOne({ username });
        const isPasswordCorrect = await bcrypt.compare(password, user.password || "");

        if (!user || !isPasswordCorrect) return res.status(400).json({ error: "Invalid username or password" });

        if (user.isFrozen) {
            user.isFrozen = false;
            await user.save();
        }


        const token = await generateTokenAndSetCookie(user, res);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
            ip: user.ip,
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log("Error in loginUser: ", error.message);
    }
};

const loginUserBabbl = async(req, res) => {
    try {
        console.log(req.body);
        const { phone, otp } = req.body;

        let tokenValidates = speakeasy.totp.verify({
            secret: phone,
            encoding: 'base32',
            token: otp,
            window: 15
        });

        if (tokenValidates == false) {
            res.status(400).json({ error: "Invalid OTP" });
        }

        const user = await User.findOne({ phone });

        const token = await generateTokenAndSetCookie(user, res);

        res.status(200).json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            username: user.username,
            profilePic: user.profilePic,
            ip: user.ip,
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log("Error in loginUser: ", error.message);
    }
};

const logoutUser = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 1 });
        res.status(200).json({ message: "User logged out successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const followUnFollowUser = async(req, res) => {
    try {
        const { userId } = req.params;
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(userId);

        if (id === userId.toString())
            return res.status(400).json({ error: "You cannot follow/unfollow yourself" });

        if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Unfollow user
            await User.findByIdAndUpdate(id, { $pull: { followers: userId } });
            await User.findByIdAndUpdate(userId, { $pull: { following: id } });
            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow user
            await User.findByIdAndUpdate(id, { $push: { followers: userId } });
            await User.findByIdAndUpdate(userId, { $push: { following: id } });
            res.status(200).json({ message: "User followed successfully" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getUserFriends = async(req, res) => {
    try {

        const userId = req.user._id;
        const usersFollowedMe = await User.findById(userId).select("followers");


        if (!usersFollowedMe) {
            return res.status(400).json({ error: "No Friends found" });
        }

        res.status(200).json({ usersFollowedMe });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const updateUser = async(req, res) => {
    const { name, email, username, password, bio } = req.body;
    let { profilePic } = req.body;

    const userId = req.params.id;
    try {
        let user = await User.findById(userId);
        if (!user) return res.status(400).json({ error: "User not found" });

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }


        if (profilePic) {
            if (user.profilePic) {
                let img = user.profilePic.split(".com/")[1]
                const params_remove_req = {
                    Bucket: process.env.AWSS3BUCKETNAME,
                    Key: img,
                }

                s3.deleteObject(params_remove_req, function(err, data) {
                    if (err) console.log(err, err.stack);
                    else console.log(data);
                });
            }


            let buf = Buffer.from(profilePic.replace(/^data:image\/\w+;base64,/, ""), 'base64')

            let fileName = uuidv4();

            const type = profilePic.split(';')[0].split('/')[1];

            let params_data = {
                Key: `${fileName.substr(fileName.length - 15)}.${type}`,
                Body: buf,
                ContentEncoding: 'base64',
                ContentType: `image/${type}`,
                Bucket: "amplifibucketfiles",
                ACL: "public-read"
            };

            const { Location, Key } = await s3.upload(params_data).promise();
            let location = Location;
            let key = Key;

            user.name = name || user.name;
            user.email = email || user.email;
            user.username = username || user.username;
            user.profilePic = location || user.profilePic;
            user.bio = bio || user.bio;

            user = await user.save();

            res.status(200).json(user);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getSuggestedUsers = async(req, res) => {
    try {
        // exclude the current user from suggested users array and exclude users that current user is already following
        const userId = req.params.id;
        console.log("userId: ", userId);

        const usersFollowedByYou = await User.findById(userId).select("following");

        if (!usersFollowedByYou) {
            return res.status(400).json({ error: "No friends found" });
        }
        const users = await User.aggregate([{
                $match: {
                    _id: { $ne: userId },
                },
            },
            {
                $sample: { size: 10 },
            },
        ]);
        const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0, 5);

        suggestedUsers.forEach((user) => (user.password = null));

        res.status(200).json(suggestedUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const freezeAccount = async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        user.isFrozen = true;
        await user.save();

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const CreateTOTP = async(req, res) => {
    const { phone } = req.body;
    try {
        let token = speakeasy.totp({
            secret: phone,
            step: 5,
            window: 30
        });

        sendOTP(phone, token);

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const VerifyTOTP = async(req, res) => {
    const { token, phone } = req.body;
    try {
        let tokenValidates = speakeasy.totp.verify({
            secret: phone,
            token: token,
            step: 5,
            window: 30
        });

        res.status(200).json({ success: tokenValidates });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export {
    signupUser,
    loginUser,
    logoutUser,
    followUnFollowUser,
    getUserFriends,
    updateUser,
    getUserProfile,
    getSuggestedUsers,
    freezeAccount,
    signupUserBabbl,
    loginUserBabbl,
    CreateTOTP,
    VerifyTOTP,
};
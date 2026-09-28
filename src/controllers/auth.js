import { createUser, findUserByEmail, verifyPassword } from '../models/users.js';

// For Registration

export function registerPage(req, res) {
    res.render('auth/register', { title: 'Register' });
}

export async function register(req, res, next) {
    const { displayName, username, email, password, confirmPassword } = req.body;

    if (!displayName || !username || !email || !password || !confirmPassword) {
        return res.status(400).render('auth/register', {
            title: 'Register',
            error: 'All fields are required.',
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).render('auth/register', {
            title: 'Register',
            error: 'Passwords do not match.',
        });
    }

    if (password.length < 8) {
        return res.status(400).render('auth/register', {
            title: 'Register',
            error: 'Password must be at least 8 characters.',
        });
    }

    try {
        await createUser({ displayName, username, email, password });
        return res.redirect('/login');
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).render('auth/register', {
                title: 'Register',
                error: 'That email or username is already registered.',
            });
        }
        return next(error);
    }
}

// For Login

export function loginPage(req, res) {
    res.render('auth/login', { title: 'Log In' });
}

export async function login(req, res, next) {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);
        const isValid = user && (await verifyPassword(password, user.passwordHash));

        if (!isValid) {
            return res.status(401).render('auth/login', {
                title: 'Log In',
                error: 'Invalid email or password.',
            });
        }

        req.session.user = {
            id: user._id.toString(),
            displayName: user.displayName,
            username: user.username,
            role: user.role.name,
        };

        return res.redirect('/admin/dashboard');
    } catch (error) {
        return next(error);
    }
}

// For Logout

export function logout(req, res, next) {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }
        res.clearCookie('connect.sid');
        return res.redirect('/');
    });
}
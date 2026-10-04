export function dashboardPage(req, res) {
    if (req.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }

    return res.render('dashboard', {
        title: 'Dashboard'
    });
}

export function profilePage(req, res) {
    return res.render('profile', {
        title: 'My Profile'
    });
}

export function userDashboardPage(req, res) {
  res.render('user/dashboard', { title: 'My Dashboard' });
}


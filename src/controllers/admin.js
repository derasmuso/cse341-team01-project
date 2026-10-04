export function adminDashboardPage(req, res) {
    res.render('admin/dashboard', { 
        title: 'Admin Dashboard' 
    });
}

export function adminUsersPage(req, res) {
    res.render('admin/users', { 
        title: 'Manage Users' 
    });
}


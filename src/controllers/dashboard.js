// src/controllers/dashboard.js

export function dashboardPage(req, res) {
  if (req.user.role === '2') {
    return res.redirect('/admin/dashboard');
  }

  return res.render('dashboard', {
    title: 'Dashboard',
  });
}

export function profilePage(req, res) {
  return res.render('profile', {
    title: 'My Profile',
  });
}

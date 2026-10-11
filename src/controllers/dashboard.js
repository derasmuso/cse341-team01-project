export function dashboardPage(req, res) {
  if (req.user.role === '2') {
    return res.redirect('/admin/dashboard');
  }

  return res.render('layouts/dashboard', {
    title: 'Dashboard',
    currentPage: 'dashboard',
    contentPartial: '../dashboard',
  });
}

export function profilePage(req, res) {
  return res.render('layouts/dashboard', {
    title: 'My Profile',
    currentPage: 'profile',
    contentPartial: '../profile',
  });
}

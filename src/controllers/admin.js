export function adminDashboardPage(req, res) {
  return res.render('layouts/dashboard', {
    title: 'Admin Dashboard',
    currentPage: 'dashboard',
    contentPartial: '../admin/dashboard',
  });
}

export function adminUsersPage(req, res) {
  return res.render('layouts/dashboard', {
    title: 'Manage Users',
    currentPage: 'users',
    contentPartial: '../admin/users',
  });
}

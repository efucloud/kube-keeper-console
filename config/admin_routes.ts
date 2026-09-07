export default [
  {
    name: "appManagement",
    icon: "appstoreAdd",
    path: "/admin/application",
    component: "./admin/application",
    access: "adminAccess",
  },
  {
    name: "appManagement",
    path: "/admin/application/create",
    hideInMenu: true,
    component: "./admin/application/form",
    access: "adminAccess",
  },
  {
    name: "appManagement",
    path: "/admin/application/:id/edit",
    hideInMenu: true,
    component: "./admin/application/form",
    access: "adminAccess",
  },
  {
    name: "account",
    path: "/admin/account",
    component: "./admin/account",
    access: "adminAccess",
  },
  {
    name: "cluster",
    path: "/admin/cluster",
    component: "./admin/cluster",
    access: "adminAccess",
  },
  {
    name: "cluster",
    path: "/admin/cluster/update/:id",
    hideInMenu: true,
    component: "./admin/cluster/form",
    access: "adminAccess",
  },
  {
    name: "cluster",
    path: "/admin/cluster/detail/:id",
    hideInMenu: true,
    component: "./admin/cluster/detail",
    access: "adminAccess",
  },
  {
    name: "cluster",
    hideInMenu: true,
    path: "/admin/cluster/create",
    component: "./admin/cluster/form",
    access: "adminAccess",
  },
  // {
  //   name: "settings",
  //   path: "/admin/settings",
  //   access: "adminAccess",
  //   routes: [
  //     {
  //       name: "license",
  //       path: "/admin/settings/license",
  //       component: "./admin/settings/license",
  //     },
  //   ],
  // },
];

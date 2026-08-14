export default [
  {
    path: "/workspace/",
    menuRender: false,
    hideInMenu: true,
    name: "workspace",
    routes: [
      {
        path: "/workspace/:code",
        component: "./kubernetes/workspace/index",
        access: "tenantViewAccess",
      },
      {
        path: "/workspace/:code/console",
        component: "./kubernetes/workspace/console",
        access: "tenantViewAccess",
      },
    ],
  },
];

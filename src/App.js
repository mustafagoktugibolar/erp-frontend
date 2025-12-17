import "devextreme/dist/css/dx.light.css";
/* src/App.js */
import { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import MDBox from "components/MDBox";
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { useMaterialUIController, setMiniSidenav, setOpenConfigurator } from "context";

import brandWhite from "assets/images/logo-ct.png";
import brandDark from "assets/images/logo-ct-dark.png";

import { api } from "api";
import Dashboard from "layouts/dashboard";
import ModulePage from "pages/ModulePage";
import CreateModule from "pages/CreateModule";

export default function App() {
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;

  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();
  const [routes, setRoutes] = useState([]);

  // RTL cache setup
  useEffect(() => {
    setRtlCache(createCache({ key: "rtl", stylisPlugins: [rtlPlugin] }));
  }, []);

  // Direction (ltr/rtl)
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Scroll to top on path change
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  // Fetch modules and build routes
  useEffect(() => {
    import("routes").then(({ default: staticRoutes }) => {
      api
        .get("/modules")
        .then((res) => {
          const SYSTEM_MODULES = ["companies", "customers", "products", "orders", "invoices"];
          const dynamic = res.data.map((m) => {
            const isSystem = SYSTEM_MODULES.includes(m.key);
            return {
              type: "collapse",
              name: m.name,
              key: m.key,
              icon: <Icon fontSize="small">{m.icon}</Icon>,
              route: m.route,
              component: <ModulePage moduleKey={m.key} moduleId={isSystem ? null : m.id} />,
            };
          });

          // Inject "Add Module" after Dashboard if it's not already in routes.js
          // Since we are moving to use routes.js as source, let's just append dynamic ones at the end
          // or ideally, we merge them.
          // staticRoutes contains Dashboard, Title, Companies...
          // We want: Dashboard, Add Module, Title, Companies..., Dynamic...

          // Let's create a specific "Add Module" route object
          const createModuleRoute = {
            type: "collapse",
            name: "Add Module",
            key: "create-module",
            icon: <Icon fontSize="small">add</Icon>,
            route: "/modules/create",
            component: <CreateModule />,
          };

          // Insert CreateModule after Dashboard (index 0 usually)
          const merged = [...staticRoutes];
          // Find index of dashboard to insert after, or just unshift/splice
          // For simplicity, let's just put it at the top or after dashboard
          // Assuming staticRoutes[0] is Dashboard
          merged.splice(1, 0, createModuleRoute);

          setRoutes([...merged, ...dynamic]);
        })
        .catch(console.error);
    });
  }, []);

  // Sidenav hover behavior
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Generate <Route> elements for collapse items
  const getRoutes = (allRoutes) =>
    allRoutes
      .filter((r) => r.type === "collapse" && r.route)
      .map((r) => <Route key={r.key} path={r.route} element={r.component} />);

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">
        settings
      </Icon>
    </MDBox>
  );

  const themeToUse =
    direction === "rtl" ? (darkMode ? themeDarkRTL : themeRTL) : darkMode ? themeDark : theme;

  const content = (
    <>
      <CssBaseline />
      {layout === "dashboard" ? (
        <Box sx={{ display: "flex" }}>
          <Sidenav
            color={sidenavColor}
            brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
            brandName="Material Dashboard 2"
            routes={routes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Box component="main" sx={{ flexGrow: 1, ml: "250px", px: 3, pt: 3 }}>
            <Configurator />
            {configsButton}
            <Routes>
              {getRoutes(routes)}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Box>
      ) : (
        <>
          {layout === "vr" && <Configurator />}
          <Routes>
            {getRoutes(routes)}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </>
      )}
    </>
  );

  return direction === "rtl" && rtlCache ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={themeToUse}>{content}</ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={themeToUse}>{content}</ThemeProvider>
  );
}

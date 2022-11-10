import "./App.css";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { createTheme, ThemeProvider } from "@mui/material/styles";

import Home from "./pages/index";
import About from "./pages/about";
import Repos from "./pages/repos";
import Repo from "./pages/repo";
import Test from "./pages/test";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Profile from "./pages/profile";

import { AuthProvider } from "./lib/auth";
import { Header, Footer } from "./components/Header";

import Box from "@mui/material/Box";
import { SnackbarProvider } from "notistack";

import Docs from "./pages/docs";

const theme = createTheme({
  typography: {
    button: {
      textTransform: "none",
    },
  },
});

function NormalLayout({ children }: any) {
  return (
    <Box>
      <Header />
      <Box pt="50px">{children}</Box>
      {/* <Footer /> */}
    </Box>
  );
}

const router = createBrowserRouter([
  {
    path: "docs",
    element: (
      <NormalLayout>
        <Docs />
      </NormalLayout>
    ),
  },
  {
    path: "repos",
    element: (
      <NormalLayout>
        <Repos />
      </NormalLayout>
    ),
  },
  {
    path: "repo/:id",
    element: (
      <Box height="100vh">
        <Header />
        <Box
          height="100%"
          boxSizing={"border-box"}
          sx={{
            pt: "50px",
          }}
        >
          <Repo />
        </Box>
      </Box>
    ),
  },
  {
    path: "login",
    element: (
      <NormalLayout>
        <Login />
      </NormalLayout>
    ),
  },
  {
    path: "signup",
    element: (
      <NormalLayout>
        <Signup />
      </NormalLayout>
    ),
  },
  {
    path: "profile",
    element: (
      <NormalLayout>
        <Profile />
      </NormalLayout>
    ),
  },
  {
    path: "about",
    element: (
      <NormalLayout>
        <About />
      </NormalLayout>
    ),
  },
  {
    path: "/",
    element: (
      <NormalLayout>
        {/* <Home /> */}
        <Repos />
      </NormalLayout>
    ),
  },
]);

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <SnackbarProvider maxSnack={5}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.tsx</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
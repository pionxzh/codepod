import React, { createContext, useState, useEffect } from "react";
export const AuthContext = createContext();

export function AuthProvider(props) {
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // load initial state from local storage
    const userId = localStorage.getItem("userId") || null;
    const token = localStorage.getItem("token") || null;
    setUserId(userId);
    setToken(token);
    console.log(`Loaded userID: ${userId}`);
    console.log(`Loaded token: ${token}`);
    if (userId && token) {
      setIsLoggedIn(true);
    }
  }, []);

  function login(email, password) {
    const query = {
      query: `
        query {
            login (
                email: "${email}",
                password: "${password}"
            ) {
                userID
                token   
            }
        }
            `,
    };
    console.log(query);
    return fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw Error("Failed");
        }
        return res.json();
      })
      .then((res) => {
        if (res.errors) {
          throw new Error(res.errors[0].message);
        }
        const userId = res.data.login.userID;
        const token = res.data.login.token;
        console.log(`Got usrId: ${userId}`);
        console.log(`Got token: ${token}`);
        setUserId(userId);
        setToken(token);
        setIsLoggedIn(true);
        // save to local storage
        console.log("Saving to localStorage ..");
        localStorage.setItem("userId", userId);
        localStorage.setItem("token", token);
      });
  }

  function logout() {
    console.log("Signing out ..");
    setUserId(null);
    setToken(null);
    setIsLoggedIn(false);
    localStorage.setItem("userId", null);
    localStorage.setItem("token", null);
  }
  function signup(username, email, password) {
    const query = {
      query: `
            mutation {
              createUser(username: "${username}",
                email: "${email}",
                password: "${password}",
                firstname:"") {
                userID
                token
              }
            }
          `,
    };
    console.log(query);
    return fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw Error("Failed");
        }
        return res.json();
      })
      .then((res) => {
        if (res.errors) {
          throw new Error(res.errors[0].message);
        }
        // No errors, redirect to login page
        // Save token, and redirect to dashboard or home
        const userId = res.data.userID;
        const token = res.data.token;
        console.log(`Got usrId: ${userId}`);
        console.log(`Got token: ${token}`);
        setUserId(userId);
        setToken(token);
        setIsLoggedIn(true);
        // save to local storage
        console.log("Saving to localStorage ..");
        localStorage.setItem("userId", userId);
        localStorage.setItem("token", token);
      });
  }
  return (
    <AuthContext.Provider
      value={{ isLoggedIn, userId, token, login, logout, signup }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
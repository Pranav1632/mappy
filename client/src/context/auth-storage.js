// src/context/auth-storage.js

let _auth = null;

export const setAuth = (auth) => {
  _auth = auth;
};

export const getAuth = () => _auth;

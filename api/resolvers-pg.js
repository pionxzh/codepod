import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Prisma from "@prisma/client";
const { PrismaClient } = Prisma;

const prisma = new PrismaClient();

// import { User, Repo, Pod } from "./db.js";

function genToken(userID) {
  const token = jwt.sign(
    {
      data: userID,
    },
    "mysuperlongsecretkey",
    {
      expiresIn: "1d",
    }
  );
  return token;
}

export const resolvers = {
  Query: {
    hello: () => {
      return "Hello world!";
    },
    users: async () => {
      console.log("Finding users ..");
      const allUsers = await prisma.user.findMany();
      return allUsers;
    },
    me: async (_, __, { userId }) => {
      if (!userId) throw Error("Unauthenticated");
      console.log("userid from ctx", userId);
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
        },
      });
      if (!user) throw Error("Authorization token is not valid");
      console.log(user);
      return user;
    },
    repos: async () => {
      const repos = await prisma.repo.findMany({
        include: {
          owner: true,
        },
      });
      return repos;
    },
    myRepos: async (_, __, { userId }) => {
      if (!userId) throw Error("Unauthenticated");
      console.log("userid from ctx", userId);
      const repos = await prisma.repo.findMany({
        where: {
          owner: {
            id: userId,
          },
        },
      });
      console.log(repos);
      return repos;
    },
    repo: async (_, { name, username }) => {
      const repo = await prisma.repo.findFirst({
        where: {
          name: name,
          owner: {
            username: username,
          },
        },
        include: {
          owner: true,
          root: true,
          pods: true,
        },
      });
      return repo;
    },
    pods: async (_, { username, reponame }) => {
      // 1. find the repo
      const repo = await prisma.repo.findFirst({
        where: {
          name: reponame,
          owner: {
            username: username,
          },
        },
      });
      const pods = await prisma.pod.findMany({
        where: {
          repo: {
            id: repo.id,
          },
        },
        include: {
          parent: true,
        },
      });
      return pods;
    },
  },
  Mutation: {
    signup: async (_, { username, email, password, name }) => {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const user = await prisma.user.create({
        data: {
          username,
          email,
          hashedPassword: hashed,
          name,
        },
      });
      return {
        token: jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        }),
      };
    },
    login: async (_, { username, password }) => {
      // FIXME findUnique seems broken https://github.com/prisma/prisma/issues/5071
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username: username }, { email: username }],
        },
      });
      if (!user) throw Error(`User does not exist`);
      const match = await bcrypt.compare(password, user.hashedPassword);
      if (!match) {
        throw Error(`Email and password do not match.`);
      } else {
        return {
          id: user.id,
          username: user.usernaame,
          token: jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
          }),
        };
      }
    },
    createRepo: async (_, { name }, { userId }) => {
      console.log("From ctx", userId);
      if (!userId) throw Error("Unauthenticated");
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
        },
      });
      console.log(user);
      // create repo $name under userId
      const repo = await prisma.repo.create({
        data: {
          name: name,
          // root: {
          //   create: {
          //     parent: null,
          //     parentId: "",
          //   },
          // },
          owner: {
            connect: {
              id: userId,
            },
          },
        },
        include: {
          owner: true,
        },
      });
      console.log(repo);
      return repo;
    },
    clearUser: () => {},
    addPod: async (_, { reponame, username, parent, type, id }) => {
      // 1. find the repo
      const repo = await prisma.repo.findFirst({
        where: {
          name: reponame,
          owner: {
            username: username,
          },
        },
      });
      const pod = await prisma.pod.create({
        data: {
          // TODO id,
          // TODO index
          type: "DECK",
          repo: {
            connect: {
              id: repo.id,
            },
          },
          parent: parent
            ? {
                connect: {
                  id: parent,
                },
              }
            : undefined,
        },
      });
      return pod;
    },
  },
};

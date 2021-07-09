import {
  Box,
  Text,
  Flex,
  Center,
  Textarea,
  Button,
  Tooltip,
  Image,
  IconButton,
  Spacer,
  Spinner,
  Code,
} from "@chakra-ui/react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuIcon,
  MenuCommand,
  MenuDivider,
} from "@chakra-ui/react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
} from "@chakra-ui/react";
import { Stack, HStack, VStack, Select } from "@chakra-ui/react";
import { useClipboard } from "@chakra-ui/react";

import {
  ArrowUpIcon,
  ArrowForwardIcon,
  ArrowDownIcon,
  CheckIcon,
  RepeatIcon,
  HamburgerIcon,
  InfoIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";
import { useRouter } from "next/router";
import Link from "next/link";
import { StyledLink } from "../../components/utils";
import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useSpring, animated, config } from "react-spring";
import useResizeObserver from "use-resize-observer";

import { repoSlice, loadPodQueue, remoteUpdatePod } from "../../lib/store";
import useMe from "../../lib/me";
import { MySlate } from "../../components/MySlate";
import { CodeSlack } from "../../components/CodeSlate";

export async function getServerSideProps({ params }) {
  // console.log(params);
  // const router = useRouter();
  // const { username, reponame } = router.query;
  // FIXME this will cause warning on React. The query is {} at first rendering.
  // And this seems to mess up the order of hooks
  // if (!username || !reponame) return null;

  // Fetch data from external API
  // const res = await fetch(`https://.../data`)
  // const data = await res.json()

  // Pass data to the page via props
  return { props: { params } };
}

export default function Repo({ params }) {
  const { username, reponame } = params;
  const dispatch = useDispatch();
  dispatch(repoSlice.actions.setRepo({ username, reponame }));
  useEffect(() => {
    // load the repo
    dispatch(loadPodQueue({ username, reponame }));
  }, []);

  const queueL = useSelector((state) => state.repo.queue.length);
  const repoLoaded = useSelector((state) => state.repo.repoLoaded);

  return (
    <Flex direction="column" m="auto">
      <Box pb={10} m="auto">
        <Text>
          Repo: <StyledLink href={`/${username}`}>{username}</StyledLink> /{" "}
          <StyledLink href={`/${username}/${reponame}`}>{reponame}</StyledLink>
        </Text>
        <Text>SyncQueue: {queueL}</Text>
        {!repoLoaded && <Text>Repo Loading ...</Text>}
      </Box>
      {repoLoaded && (
        <Box m="auto">
          <Box
            overflowX="scroll"
            border="solid 3px"
            p={5}
            m={5}
            maxW={["sm", "lg", "3xl", "4xl", "6xl"]}
          >
            <Box>
              <Deck id="ROOT" />
            </Box>
          </Box>
        </Box>
      )}
    </Flex>
  );
}

function SyncStatus({ pod }) {
  const dispatch = useDispatch();
  return (
    <Box>
      {pod.status !== "dirty" &&
        pod.status !== "synced" &&
        pod.status !== "syncing" && <Box>Error {pod.status}</Box>}
      {pod.status === "dirty" && (
        <Box>
          <IconButton
            icon={<RepeatIcon />}
            colorScheme={"yellow"}
            onClick={() => {
              dispatch(
                remoteUpdatePod({
                  id: pod.id,
                  content: pod.content,
                  type: pod.type,
                  lang: pod.lang,
                })
              );
            }}
          ></IconButton>
        </Box>
      )}
      {pod.status === "synced" && (
        <Box>
          <CheckIcon color="green" />
        </Box>
      )}
      {pod.status === "syncing" && (
        <Box>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        </Box>
      )}
    </Box>
  );
}

function InfoBar({ pod }) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState(pod.id);
  const { hasCopied, onCopy } = useClipboard(value);
  // return <Box></Box>;
  return (
    <Box>
      <Popover>
        <PopoverTrigger>
          <IconButton icon={<InfoIcon />}></IconButton>
          {/* <InfoIcon /> */}
        </PopoverTrigger>
        <PopoverContent w="lg">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>Info</PopoverHeader>
          <PopoverBody>
            <Text>
              ID:{" "}
              <Code colorScheme="blackAlpha">
                {
                  // pod.id.substring(0, 8)
                  pod.id
                }
              </Code>
              <Button onClick={onCopy}>{hasCopied ? "Copied" : "Copy"}</Button>
            </Text>
            <Text mr={5}>Index: {pod.index}</Text>
            <Text>
              Parent:{" "}
              <Code colorScheme="blackAlpha">{pod.parent.substring(0, 8)}</Code>
            </Text>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
}

function ToolBar({ pod }) {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  // return <Box></Box>;
  return (
    // Putting Menu under Stack caused warnings. Wrapping it with Box removes
    // that wraning. See https://github.com/chakra-ui/chakra-ui/issues/3440
    <Box>
      <Menu>
        <MenuButton as={IconButton} icon={<HamburgerIcon />}></MenuButton>
        <MenuList>
          <MenuItem>Type: Code</MenuItem>
          <MenuItem
            onClick={() => {
              dispatch(
                repoSlice.actions.addPod({
                  parent: pod.parent,
                  index: pod.index,
                  type: "CODE",
                })
              );
            }}
          >
            Add Pod Up <ArrowUpIcon />
          </MenuItem>
          <MenuItem
            onClick={() => {
              dispatch(
                repoSlice.actions.addPod({
                  parent: pod.parent,
                  index: pod.index,
                  type: "DECK",
                })
              );
            }}
          >
            Add Deck Up <ArrowUpIcon />
          </MenuItem>
          <MenuItem
            color="red"
            onClick={() => {
              dispatch(repoSlice.actions.deletePod({ id: pod.id }));
            }}
          >
            <u>D</u>elete
          </MenuItem>
          <MenuItem
            onClick={() => {
              dispatch(
                repoSlice.actions.addPod({
                  parent: pod.parent,
                  index: pod.index + 1,
                  type: "CODE",
                })
              );
            }}
          >
            Add Pod Down <ArrowDownIcon />
          </MenuItem>
          <MenuItem
            onClick={() => {
              dispatch(
                repoSlice.actions.addPod({
                  parent: pod.parent,
                  index: pod.index + 1,
                  type: "DECK",
                })
              );
            }}
          >
            Add Deck Down <ArrowDownIcon />
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}

function LanguageMenu({ pod }) {
  const dispatch = useDispatch();
  return (
    <Box>
      <Select
        placeholder="Select option"
        value={pod.lang || ""}
        onChange={(e) =>
          dispatch(
            repoSlice.actions.setPodLang({
              id: pod.id,
              lang: e.target.value,
            })
          )
        }
      >
        <option value="js">JavaScript</option>
        <option value="css">CSS</option>
        <option value="html">HTML</option>
        <option value="python">Python</option>
        <option value="sql">SQL</option>
        <option value="java">Java</option>
        <option value="php">PHP</option>
      </Select>
    </Box>
  );
}

function TypeMenu({ pod }) {
  const dispatch = useDispatch();
  return (
    <Box>
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
          {pod.type}
        </MenuButton>
        <MenuList>
          <MenuItem
            onClick={() => {
              dispatch(
                repoSlice.actions.setPodType({
                  id: pod.id,
                  type: "CODE",
                })
              );
            }}
          >
            Code
          </MenuItem>
          <MenuItem
            onClick={() => {
              dispatch(
                repoSlice.actions.setPodType({
                  id: pod.id,
                  type: "WYSIWYG",
                })
              );
            }}
          >
            WYSIWYG
          </MenuItem>
          <MenuItem
            onClick={() => {
              dispatch(
                repoSlice.actions.setPodType({
                  id: pod.id,
                  type: "MD",
                })
              );
            }}
          >
            Markdown
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}

function PodOrDeck({ id }) {
  const pod = useSelector((state) => state.repo.pods[id]);
  const dispatch = useDispatch();
  // this update the pod, insert if not exist
  if (!pod) {
    return <Box>Error: pod is undefined: {id}</Box>;
  }
  const isDeck = pod.type === "DECK";

  return (
    <VStack align="start" p={2}>
      <HStack>
        <InfoBar pod={pod} />
        <ToolBar pod={pod} />
        <SyncStatus pod={pod} />
        {pod.type !== "DECK" && <TypeMenu pod={pod} />}
        {pod.type === "CODE" && <LanguageMenu pod={pod} />}
      </HStack>

      {/* the pod iteself */}
      {isDeck ? <Deck id={id} /> : <Pod id={id} />}
    </VStack>
  );
}

function Deck({ id }) {
  const pod = useSelector((state) => state.repo.pods[id]);
  const dispatch = useDispatch();
  const { ref: right, width = 0, height = 0 } = useResizeObserver();

  return (
    <Box border="solid 1px" p={3}>
      <Flex align="center">
        {/* LEFT */}
        <Flex>
          <Text>
            <Tooltip label={pod.id}>Deck</Tooltip>
          </Text>
          {pod.children.length === 0 && (
            <Box>
              <Button
                ml={1}
                size="xs"
                onClick={() => {
                  dispatch(
                    repoSlice.actions.addPod({
                      parent: pod.id,
                      type: "CODE",
                      index: 0,
                    })
                  );
                }}
              >
                Add Pod <ArrowForwardIcon />
              </Button>
              <Button
                ml={1}
                size="xs"
                onClick={() => {
                  dispatch(
                    repoSlice.actions.addPod({
                      parent: pod.id,
                      index: 0,
                      type: "DECK",
                    })
                  );
                }}
              >
                Add Deck <ArrowForwardIcon />
              </Button>
            </Box>
          )}
        </Flex>

        {/* The brace */}
        <div>
          <Image
            src="/GullBraceLeft.svg"
            alt="brace"
            h={height}
            maxW="none"
            w="20px"
          />
        </div>

        {/* RIGHT */}
        <Flex direction="column" ref={right}>
          {pod.children.map((id) => {
            return <PodOrDeck id={id} key={id}></PodOrDeck>;
          })}
        </Flex>
      </Flex>
    </Box>
  );
}

function Pod({ id }) {
  const pod = useSelector((state) => state.repo.pods[id]);
  const dispatch = useDispatch();
  if (pod.type === "WYSIWYG") {
    return (
      <Box border="1px" w="sm">
        <MySlate
          value={
            pod.content || [
              {
                type: "paragraph",
                children: [
                  {
                    text: "",
                  },
                ],
              },
            ]
          }
          onChange={(value) => {
            dispatch(repoSlice.actions.setPodContent({ id, content: value }));
          }}
          placeholder="Write some rich text"
        />
      </Box>
    );
  } else if (pod.type === "MD") {
    return (
      <Textarea
        w="xs"
        onChange={(e) => {
          dispatch(
            repoSlice.actions.setPodContent({ id, content: e.target.value })
          );
        }}
        value={pod.content || ""}
        placeholder="Markdown here"
      ></Textarea>
    );
  } else if (pod.type === "CODE") {
    return (
      <Box border="1px" w="sm">
        <CodeSlack
          value={
            pod.content || [
              {
                type: "paragraph",
                children: [{ text: "" }],
              },
            ]
          }
          onChange={(value) => {
            dispatch(repoSlice.actions.setPodContent({ id, content: value }));
          }}
          language={pod.lang || "javascript"}
        />
      </Box>
    );
  } else {
    throw new Error(`Invalid pod type ${type}`);
  }
}

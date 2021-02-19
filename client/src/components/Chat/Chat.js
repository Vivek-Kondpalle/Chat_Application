import React, { useEffect, useState } from "react";
import queryString from "query-string";
import io from "socket.io-client";
import "./Chat.css";
import InfoBar from "../InfoBar/InfoBar";
import Input from "../Input/Input";
import Messages from "../Messages/Messages";
import TextContainer from "../TextContainer/TextContainer";

let socket;

const Chat = ({ location }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const ENDPOINT = "localhost:5000";

  useEffect(() => {
    const { name, room } = queryString.parse(location.search);
    /* Location.search return "?name=vivek&room=room" for name=vivek and room =room.
      Data return an object with name and room keys. thats why we can destructor it */

    socket = io(ENDPOINT, {
      transports: ["websocket", "polling", "flashsocket"],
    });
    setName(name);
    setRoom(room);
    /* console.log(socket); Returns a socket instance which has socket id among other things. 
      if you go to index.js in server you would see 2 times "We have a new connection" and 
      2 times "user dissconnected" when 1 user logs in and logs out.
      To solve this we pass [] to useEffect. It means effect will only activate if values in list change.*/

    socket.emit("join", { name, room }, (error) => {
      if (error) {
        alert(error);
      }
    });

    return () => {
      socket.emit("disconnect");
      socket.off();
    };
    /* return is used for unmounting. when a particular socket instance is disconnected it will emit 
      a disconnect event */
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket.on("message", (message) => {
      setMessages((messages) => [...messages, message]);
      // console.log(messages);
    });

    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });
    // return () => {
    //   socket.off();
    // };
  }, []);

  const sendMessage = (event) => {
    event.preventDefault();
    if (message) {
      socket.emit("sendMessage", message, () => setMessage(""));
    }
  };

  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages messages={messages} name={name} />
        <Input
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      </div>
      <TextContainer users={users} />
    </div>
  );
};

export default Chat;

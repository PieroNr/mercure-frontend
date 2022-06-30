import React, { Component, useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import axios from "axios";
import RNEventSource from "react-native-event-source";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

class LoadingPos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "rien reçu",
      location: null,
      errorMsg: null,
      locations: {},
    };
  }

  async componentDidMount() {
    const apiUrl = "https://hangover.timotheedurand.fr/api/";

    // création de l'objet URLavec l'url du hub mercure + ajout des abonnements aux différents topics
    let url = "https://hangover-hub.timotheedurand.fr/.well-known/mercure";

    const api = axios.create({
      baseURL: apiUrl,
      headers: {
        Authorization:
          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE2NTY1ODE0MTEsImV4cCI6MTY4NjU4NTAxMSwicm9sZXMiOlsiUk9MRV9BRE1JTiIsIlJPTEVfVVNFUiJdLCJlbWFpbCI6ImFkbWluQGhhbmdvdmVyLmNvbSJ9.UkAsrymB2wjeaBYCcrFChPWWL00EHGryjl-AIn_Zdn-Nu0QvijEKy0lAA6TW09FiXvGSn5LitYdyNkWaZIypcjJm5WJwZwY5iZh1DJNk28V_p-C2fMqHHjN9pCrD0t1TxmmVepE6RN_TUAy0bAcOLATcLB3Z0nSLV1tHbm2EAsPvxC2PAuXfOQw8dcIl6Ge16EmqVO0m0A-XyKMFMpXYSdYwAt0aqvooBj1-aQKHFLu3elExwJc_R09L56yL40CnkKhVB-y0tAHxNdK2rW_1TTSxOPTaqPYUuAXi8JVqCEnhpM3bUdbcos1MBKfouWqYc2quS1AQfj3KIx83_-HwRw",
        Accept: "application/json",
      },
    });

    try {
      const response = await api.get("users/21");
      const currentUser = response.data;
      const friendships = await (await api.get("friendships/user/21")).data;

      for (const friend of friendships) {
        if (friendships.indexOf(friend) == 0) {
          url = url.concat(
            "?",
            `topic=https://hangoverapp.fr/loc/api/friend/user/${friend.id}`
          );
        } else {
          url = url.concat(
            "&",
            `topic=https://hangoverapp.fr/loc/api/friend/user/${friend.id}`
          );
        }

        /* url.searchParams.append('topic', `https://hangoverapp.fr/loc${friends}`); */
      }
      url = url.concat(
        "&",
        `topic=https://hangoverapp.fr/loc/api/friend/user/${currentUser.id}`
      );
      console.log(url);
      /*  url.searchParams.append('topic', 'https://hangoverapp.fr/loc/api/friendships/12'); */

      this.listenTopics(url, currentUser);
      this.initMap(currentUser);
    } catch (e) {
      console.error(`Error: ${e.response.data}`);
    }
  }

  async sendMyLocation(currentUser) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      this.setState({ errorMsg: "Permission to access location was denied" });
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    this.createMessagePosition(location, currentUser);
    this.setState({
      location: location.coords.latitude + " " + location.coords.longitude,
    });
    return location;
  }

  async initMap(currentUser) {
    this.sendMyLocation(currentUser);

    this.getAllFriendLocation(currentUser);
    /* this.createMessagePosition(location, currentUser);
        this.setState({location: location.coords.latitude + ' ' + location.coords.longitude}); */
    const TASK_NAME = "LOCATION_TASK_NAME";
    TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error(error);
        return;
      }
      if (data) {
        // Extract location coordinates from data
        const { locations } = data;

        const location = locations[0];

        if (location) {
          this.createMessagePosition(location, currentUser);
          this.setState({
            location:
              location.coords.latitude + " " + location.coords.longitude,
          });
        }
      }
    });

    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Location",
        notificationBody: "Location tracking in background",
        notificationColor: "#fff",
      },
      deferredUpdatesDistance: 5,
    });
  }

  getAllFriendLocation(currentUser) {
    const details = {
      topic: "https://hangoverapp.fr/loc/api/friend/user/" + currentUser.id,
      data: JSON.stringify({
        message: {
          user: currentUser,
          ask: "Give me your location",
        },
      }),
    };

    // création du body de la requete post
    let formBody = [];
    for (const property in details) {
      const encodedKey = encodeURIComponent(property);
      const encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }

    formBody = formBody.join("&");

    // envoi de la requete avec l'url du hub mercure, la methode, le header avec le token d'envoi (celui-ci marche avec tous les topics) et le content-type (important) etenfin le body avec l'objet précédent
    fetch("https://hangover-hub.timotheedurand.fr/.well-known/mercure", {
      method: "POST",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJtZXJjdXJlIjp7InB1Ymxpc2giOlsiKiJdLCJzdWJzY3JpYmUiOlsiKiJdLCJwYXlsb2FkIjp7InVzZXIiOiJodHRwczovL2V4YW1wbGUuY29tL3VzZXJzL2R1bmdsYXMiLCJyZW1vdGVBZGRyIjoiMTI3LjAuMC4xIn19fQ.iYRYJoHNXmfpzg9DnTSBc6fAbddMKUPRpdvtsLAq-pI",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });
  }

  async listenTopics(url, currentUser) {
    const options = {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJtZXJjdXJlIjp7InB1Ymxpc2giOlsiKiJdLCJzdWJzY3JpYmUiOlsiKiJdLCJwYXlsb2FkIjp7InVzZXIiOiJodHRwczovL2V4YW1wbGUuY29tL3VzZXJzL2R1bmdsYXMiLCJyZW1vdGVBZGRyIjoiMTI3LjAuMC4xIn19fQ.iYRYJoHNXmfpzg9DnTSBc6fAbddMKUPRpdvtsLAq-pI",
      },
    };
    const eventSource = new RNEventSource(url, options);

    eventSource.addEventListener("message", (data) => {
      const userData = JSON.parse(data.data).message.user;
      if (JSON.parse(data.data).message.ask) {
        this.sendMyLocation(currentUser);
        return;
      }
      const location = JSON.parse(data.data).message.location;
      const { locations } = this.state;
      locations[userData.id] =
        userData.firstName +
        " " +
        userData.lastName +
        " : lat -> " +
        location.lat +
        " , long -> " +
        location.long;
      this.setState({ locations });
    });
  }

  // création du message à publish
  createMessagePosition(position, currentUser) {
    // l'objet à envoyer doit contenir une partie topic avec l'url du topic a qui envoyer ainsi qu'une partie data (appellation obligatoire) qui contient le message à écouter (obliger aussi)
    const details = {
      topic: "https://hangoverapp.fr/loc/api/friend/user/" + currentUser.id,
      data: JSON.stringify({
        message: {
          user: currentUser,
          location: {
            lat: position.coords.latitude,
            long: position.coords.longitude,
          },
        },
      }),
    };

    // création du body de la requete post
    let formBody = [];
    for (const property in details) {
      const encodedKey = encodeURIComponent(property);
      const encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }

    formBody = formBody.join("&");

    // envoi de la requete avec l'url du hub mercure, la methode, le header avec le token d'envoi (celui-ci marche avec tous les topics) et le content-type (important) etenfin le body avec l'objet précédent
    fetch("https://hangover-hub.timotheedurand.fr/.well-known/mercure", {
      method: "POST",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJtZXJjdXJlIjp7InB1Ymxpc2giOlsiKiJdLCJzdWJzY3JpYmUiOlsiKiJdLCJwYXlsb2FkIjp7InVzZXIiOiJodHRwczovL2V4YW1wbGUuY29tL3VzZXJzL2R1bmdsYXMiLCJyZW1vdGVBZGRyIjoiMTI3LjAuMC4xIn19fQ.iYRYJoHNXmfpzg9DnTSBc6fAbddMKUPRpdvtsLAq-pI",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });
  }

  render() {
    return (
      <View>
        <Text>{this.state.location}</Text>
        <Text>{this.state.errorMsg}</Text>
        {Object.values(this.state.locations).map((t, i) => (
          <Text key={i}>{t}</Text>
        ))}
      </View>
    );
  }
}

export default LoadingPos;

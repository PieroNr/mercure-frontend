import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
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
      friends: [],
    };
  }

  async componentDidMount() {
    const apiUrl = "https://hangover.timotheedurand.fr/api/";

    // création de l'objet URLavec l'url du hub mercure + ajout des abonnements aux différents topics
    let url = "https://hangover-hub.timotheedurand.fr/.well-known/mercure";
    const TASK_NAME = "LOCATION_TASK_NAME";

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

      for (const friend of friendships) {
        if (friendships.indexOf(friend) === 0) {
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
        this.state.friends.push({
          id: friend.id,
          firstname: friend.firstName,
          lastname: friend.lastName,
          profilePicture:
            "https://us.123rf.com/450wm/mialima/mialima1603/mialima160300025/55096766-ic%C3%B4ne-d-utilisateur-homme-isol%C3%A9-sur-un-fond-blanc-compte-avatar-pour-le-web-utilisateur-photo-de-pro.jpg?ver=6",
        });

        /* url.searchParams.append('topic', `https://hangoverapp.fr/loc${friends}`); */
      }
      console.log(this.state.friends);
      url = url.concat(
        "&",
        `topic=https://hangoverapp.fr/loc/api/friend/user/${currentUser.id}`
      );

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

  ghostMode(currentUser) {
    const details = {
      topic: "https://hangoverapp.fr/loc/api/friend/user/" + currentUser.id,
      data: JSON.stringify({
        message: {
          user: currentUser,
          ask: "Ghost",
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
      <View style={styles.container}>
        <View style={styles.body}>
          <FlatList
            style={styles.container}
            enableEmptySections
            data={this.state.friends}
            keyExtractor={(item) => {
              return item.id;
            }}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image
                      style={styles.image}
                      source={{ uri: item.profilePicture }}
                    />
                    <Text style={styles.username}>
                      {item.firstname} {item.lastname}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <Text>{this.state.location}</Text>
          <Text>{this.state.errorMsg}</Text>
          {Object.values(this.state.locations).map((t, i) => (
            <Text key={i}>{t}</Text>
          ))}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  image: {
    width: 60,
    height: 60,
  },
  body: {
    padding: 30,
    backgroundColor: "#E6E6FA",
  },
  box: {
    padding: 5,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: "#FFF",
    flexDirection: "row",
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowOffset: {
      height: 1,
      width: -2,
    },
    elevation: 2,
  },
  username: {
    color: "#20B2AA",
    fontSize: 22,
    alignSelf: "center",
    marginLeft: 10,
  },
});

export default LoadingPos;

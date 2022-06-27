import React, { Component, useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import RNEventSource from 'react-native-event-source';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';





class LoadingPos extends Component {
  
    constructor(props) {
        super(props);
        this.state = {
          text: 'rien reçu', 
          location : null,
          errorMsg: null
        };

        
       
        
        
  
      }
    
      
    componentDidMount(){
        

        
        const apiUrl = 'https://hangover.timotheedurand.fr/api/';
        
       
        // création de l'objet URLavec l'url du hub mercure + ajout des abonnements aux différents topics
        const url = new URL('https://hangover-hub.timotheedurand.fr/.well-known/mercure');
        
          axios.get(`${apiUrl}users/12`, { headers: {
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE2NTYzMzE0OTAsImV4cCI6MTY1NjMzNTA5MCwicm9sZXMiOlsiUk9MRV9BRE1JTiIsIlJPTEVfVVNFUiJdLCJlbWFpbCI6ImFkbWluQGhhbmdvdmVyLmNvbSJ9.4j2aEBEPHfhPkd5HwuSeZSf6LHvJ8w829tixvBKAnBirSDajpOkLZZpFinPhz3_ptqYiUlE825jAmmnjeSE08asJHuc5K180IcXl6dlKN9qAPxsHsZVoeBv6-TlZUWRDzgeEuEqCFF2m9W8C3MmiEDqIEP54JAaaS6SrY9S5XSv44HxPHXtILas5p8Bx6KCRdUzJ6M-soOsJEwUameShntS0Hn0dIWoGwmaUelKEaVZB1iGtPG8emLWdWRDKN9-Mpe0WMAbn-jTpG4sxxntiFpvgnEiCkTdYhLW19NRtq9u3iRAdx_B1vc8UpS09yfhe3c6lgOJV4_xFGahrTg_YQg'
          }})
          .then((response) => {
            const currentUser = response.data;
            let friendships = response.data.friendships;

            friendships = friendships.concat(response.data.friendsWithMe);

            console.log(friendships);
            for(let friends of friendships){
              console.log(friends);
              url.searchParams.append('topic', `https://hangoverapp.fr/loc${friends}`);
            }
            url.searchParams.append('topic', 'https://hangoverapp.fr/loc/api/friendships/12');

            this.listenTopics(url);
  
            
            
            
          })
          .catch(error => console.error(`Error: ${error.message}`));
          
          
          console.log(url);

          this.initMap();
        
          

        //token de reception(inutile pour l'instant)
        
        
        // ecoute des 3 topics
        

        // publish de la location de l'appareil
        
        
        // si receptionde modif sur un des 3 topic alors on récupère la prop message avecsa valeur
        

    };

    async initMap(){
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          this.setState({ errorMsg:'Permission to access location was denied'});
          return;
        }
        const LOCATION_TASK_NAME = "LOCATION_TASK_NAME"
        let location = await Location.getCurrentPositionAsync({});
        this.createMessagePosition(location);
        this.setState({location: location.coords.latitude + ' ' + location.coords.longitude});

        TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
          if (error) {
            console.error(error)
            return
          }
          if (data) {
            // Extract location coordinates from data
            const { locations } = data
            const location = locations[0]
            
            if (location) {
              this.createMessagePosition(location);
              this.setState({location: location.coords.latitude + ' ' + location.coords.longitude});
              
            }
          }
        });

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
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

    listenTopics(url){
      const options = {headers : { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJtZXJjdXJlIjp7InB1Ymxpc2giOlsiKiJdLCJzdWJzY3JpYmUiOlsiKiJdLCJwYXlsb2FkIjp7InVzZXIiOiJodHRwczovL2V4YW1wbGUuY29tL3VzZXJzL2R1bmdsYXMiLCJyZW1vdGVBZGRyIjoiMTI3LjAuMC4xIn19fQ.iYRYJoHNXmfpzg9DnTSBc6fAbddMKUPRpdvtsLAq-pI" }};
      const eventSource = new RNEventSource("https://hangover-hub.timotheedurand.fr/.well-known/mercure?topic=https://hangoverapp.fr/loc/api/friendships/12&topic=https://hangoverapp.fr/loc/api/friendships/17", options);


      eventSource.addEventListener('message', (data) => {
        console.log('lhkgf')
        console.log(data);
        this.setState({text: JSON.parse(data.data).message.lat + ' ' + JSON.parse(data.data).message.long});
      });
      
    }

    // récupération de la localisation
    /* sendLocation(){
      
      if (navigator.geolocation){    
        
        navigator.geolocation.getCurrentPosition(this.createMessagePosition);
        navigator.geolocation.watchPosition(this.createMessagePosition,null,{distanceFilter: 5});
      }  else {
        console.log("Geolocation is not supported by this browser.");
      }
    } */
    
    // création du message à publish
    createMessagePosition(position) {
      
      // l'objet à envoyer doit contenir une partie topic avec l'url du topic a qui envoyer ainsi qu'une partie data (appellation obligatoire) qui contient le message à écouter (obliger aussi)
      let details = {
        'topic': 'https://hangoverapp.fr/loc/api/friendships/12',
        'data': JSON.stringify({'message' : {
          'lat': position.coords.latitude,
          'long': position.coords.longitude
        }})
        
      }
      
      // création du body de la requete post
      let formBody = [];
      for (let property in details){
        let encodedKey = encodeURIComponent(property);
        let encodedValue= encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }

      formBody = formBody.join("&");

      
      // envoi de la requete avec l'url du hub mercure, la methode, le header avec le token d'envoi (celui-ci marche avec tous les topics) et le content-type (important) etenfin le body avec l'objet précédent
      fetch('https://hangover-hub.timotheedurand.fr/.well-known/mercure', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJtZXJjdXJlIjp7InB1Ymxpc2giOlsiKiJdLCJzdWJzY3JpYmUiOlsiKiJdLCJwYXlsb2FkIjp7InVzZXIiOiJodHRwczovL2V4YW1wbGUuY29tL3VzZXJzL2R1bmdsYXMiLCJyZW1vdGVBZGRyIjoiMTI3LjAuMC4xIn19fQ.iYRYJoHNXmfpzg9DnTSBc6fAbddMKUPRpdvtsLAq-pI',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody
      });
          
          
    }  
      

    render() {
      
        return (
            <View>
                <Text>{this.state.text}</Text>
                <Text>{this.state.location}</Text>
                <Text>{this.state.errorMsg}</Text>
            </View>

        );
    }

}

export default LoadingPos;
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
          errorMsg: null,
          locations: {},
        };

        
       
        
        
  
      }
    
      
    async componentDidMount(){
        

        
        const apiUrl = 'https://hangover.timotheedurand.fr/api/';
        
       
        // création de l'objet URLavec l'url du hub mercure + ajout des abonnements aux différents topics
        let url = 'https://hangover-hub.timotheedurand.fr/.well-known/mercure';

        try {
          const response = await axios.get(`${apiUrl}users/44`, { headers: {
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE2NTY0MDI0NDMsImV4cCI6MTY4NjQwNjA0Mywicm9sZXMiOlsiUk9MRV9BRE1JTiIsIlJPTEVfVVNFUiJdLCJlbWFpbCI6ImFkbWluQGhhbmdvdmVyLmNvbSJ9.YpQu8JKKZTVrDSEAwTc66jyxw7hhQu7G499TKCBgC7OkofHPWNYgALGGr5kp5mKcftAbEvF6G5QTuWIW_sF9aDUSRXmOS8bNarBMdZohqqC4-wlTs8lMP6BoNxRr6ZrCL9Vd6ifN9lPs02nkjR3M_eaHZjZdwI9xbkhN7KPu9sc7wXqd2yqgKjmjWC-SfH_7AR45t1YeDUpk1Fu7izWEgpj5kOrTUimaCYCp6aGiS9u3Gpm4B6rkR7xrL69Zdaz2cyHHaIbD_ccYmWq2_tE_8B8Qh9BuZVrFKLAkzjqutWwsC18LBbBucBhjxK9JX022x_vew1iUS0awwlCx5Gb2og'
          }})
            const currentUser = response.data;
            let friendships = response.data.friendships;

            friendships = friendships.concat(response.data.friendsWithMe);

            
            for(let friend of friendships){
              
              if(friendships.indexOf(friend) == 0){
                url = url.concat('?', `topic=https://hangoverapp.fr/loc${friend}`);
              } else {
                url = url.concat('&', `topic=https://hangoverapp.fr/loc${friend}`);
              }
              
              
              
              /* url.searchParams.append('topic', `https://hangoverapp.fr/loc${friends}`); */
            }
            url = url.concat('&', `topic=https://hangoverapp.fr/loc/api/friendships/44`);
            
           /*  url.searchParams.append('topic', 'https://hangoverapp.fr/loc/api/friendships/12'); */

            this.listenTopics(url);
            this.initMap(currentUser);
  
            
            
        } catch (e) {
          console.error(`Error: ${error.message}`)
        } 
  
          
        
          

          
        
          

        //token de reception(inutile pour l'instant)
        
        
        // ecoute des 3 topics
        

        // publish de la location de l'appareil
        
        
        // si receptionde modif sur un des 3 topic alors on récupère la prop message avecsa valeur
        

    };

    async initMap(currentUser){
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          this.setState({ errorMsg:'Permission to access location was denied'});
          return;
        }
        const LOCATION_TASK_NAME = "LOCATION_TASK_NAME"
        let location = await Location.getCurrentPositionAsync({});
        this.createMessagePosition(location, currentUser);
        this.setState({location: location.coords.latitude + ' ' + location.coords.longitude});

        TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
          if (error) {
            console.error(error)
            return
          }
          if (data) {
            // Extract location coordinates from data
            const { locations } = data;
            
            const location = locations[0]
            
            if (location) {
              this.createMessagePosition(location, currentUser);
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
      const eventSource = new RNEventSource(url, options);


      eventSource.addEventListener('message', (data) => {

        const userData = JSON.parse(data.data).message.user;
        const location = JSON.parse(data.data).message.location;
        const {locations} = this.state;
        locations[userData.id] = userData.firstName + ' ' + userData.lastName + ' : lat -> ' + location.lat + ' , long -> ' + location.long
        console.log(locations);
        this.setState({locations});
      
      });
      
    }

    
    
    // création du message à publish
    createMessagePosition(position, currentUser) {
      
      // l'objet à envoyer doit contenir une partie topic avec l'url du topic a qui envoyer ainsi qu'une partie data (appellation obligatoire) qui contient le message à écouter (obliger aussi)
      let details = {
        'topic': 'https://hangoverapp.fr/loc/api/friendships/' + currentUser.id,
        'data': JSON.stringify({'message' : {
          'user': currentUser,
          'location': {
            'lat': position.coords.latitude,
            'long': position.coords.longitude
          }
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
                {
                  Object.values(this.state.locations).map((t,i) => <Text key={i}>{t}</Text>)
                }
            </View>

        );
    }

}

export default LoadingPos;
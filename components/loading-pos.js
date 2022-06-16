import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';




class LoadingPos extends Component {
    constructor(props) {
        super(props);
        this.state = {
          text: 'rien reçu'
        };
      }
    componentDidMount(){
        

        //token de reception(inutile pour l'instant)
        const options = { authorizationHeader: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJtZXJjdXJlIjp7InB1Ymxpc2giOlsiKiJdLCJzdWJzY3JpYmUiOlsiaHR0cHM6Ly9leGFtcGxlLmNvbS9teS1wcml2YXRlLXRvcGljIiwie3NjaGVtZX06Ly97K2hvc3R9L2RlbW8vYm9va3Mve2lkfS5qc29ubGQiLCIvLndlbGwta25vd24vbWVyY3VyZS9zdWJzY3JpcHRpb25zey90b3BpY317L3N1YnNjcmliZXJ9Il0sInBheWxvYWQiOnsidXNlciI6Imh0dHBzOi8vZXhhbXBsZS5jb20vdXNlcnMvZHVuZ2xhcyIsInJlbW90ZUFkZHIiOiIxMjcuMC4wLjEifX19.3hufqajaGI1i_wduX-bOg9lrBv3ybzeU9GdJLxyXyF4" };
       
        // création de l'objet URLavec l'url du hub mercure + ajout des abonnements aux différents topics
        const url = new  URL('http://hangover-hub.timotheedurand.fr/.well-known/mercure');
        url.searchParams.append('topic', 'https://example.com/my-private-topic');
        url.searchParams.append('topic', 'https://example.com/my-public-topic');
        url.searchParams.append('topic', 'https://hangoverapp.fr/loc-user-12');
        
        // ecoute des 3 topics
        const eventSource = new EventSource(url);

        // publish de la location de l'appareil
        this.sendLocation();
        
        // si receptionde modif sur un des 3 topic alors on récupère la prop message avecsa valeur
        eventSource.addEventListener('message', (data) => {
            console.log(data);
            this.setState({text: JSON.parse(data.data).message.lat + ' ' + JSON.parse(data.data).message.long});
          });

    };

    // récupération de la localisation
    sendLocation(){
      if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(this.createMessagePosition);
      }  else {
        console.log("Geolocation is not supported by this browser.");
      }
    }
    
    // création du message à publish
    createMessagePosition(position) {

      // l'objet à envoyer doit contenir une partie topic avec l'url du topic a qui envoyer ainsi qu'une partie data (appellation obligatoire) qui contient le message à écouter (obliger aussi)
      let details = {
        'topic': 'https://hangoverapp.fr/loc-user-12',
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
      fetch('http://hangover-hub.timotheedurand.fr/.well-known/mercure', {
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
            </View>

        );
    }

}

export default LoadingPos;
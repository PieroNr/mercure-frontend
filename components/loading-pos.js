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
        
        const options = { authorizationHeader: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJtZXJjdXJlIjp7InB1Ymxpc2giOlsiKiJdLCJzdWJzY3JpYmUiOlsiaHR0cHM6Ly9leGFtcGxlLmNvbS9teS1wcml2YXRlLXRvcGljIiwie3NjaGVtZX06Ly97K2hvc3R9L2RlbW8vYm9va3Mve2lkfS5qc29ubGQiLCIvLndlbGwta25vd24vbWVyY3VyZS9zdWJzY3JpcHRpb25zey90b3BpY317L3N1YnNjcmliZXJ9Il0sInBheWxvYWQiOnsidXNlciI6Imh0dHBzOi8vZXhhbXBsZS5jb20vdXNlcnMvZHVuZ2xhcyIsInJlbW90ZUFkZHIiOiIxMjcuMC4wLjEifX19.3hufqajaGI1i_wduX-bOg9lrBv3ybzeU9GdJLxyXyF4" };
       

        const url = new  URL('http://hangover-hub.timotheedurand.fr/.well-known/mercure');
        url.searchParams.append('topic', 'https://example.com/my-private-topic');
        url.searchParams.append('topic', 'https://example.com/my-public-topic');
        url.searchParams.append('topic', 'https://hangoverapp.fr/loc-user-12');
        

        const eventSource = new EventSource(url);

        
        this.sendLocation();
        
        
        eventSource.addEventListener('message', (data) => {
            console.log(data);
            this.setState({text: JSON.parse(data.data).message.lat + ' ' + JSON.parse(data.data).message.long});
          });

    };

    sendLocation(){
      if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(this.createMessagePosition);
      }  else {
        console.log("Geolocation is not supported by this browser.");
      }
    }
    
    createMessagePosition(position) {
      let details = {
        'topic': 'https://hangoverapp.fr/loc-user-12',
        'data': JSON.stringify({'message' : {
          'lat': position.coords.latitude,
          'long': position.coords.longitude
        }})
        
      }
  
      let formBody = [];
      for (let property in details){
        let encodedKey = encodeURIComponent(property);
        let encodedValue= encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }

      formBody = formBody.join("&");

      

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
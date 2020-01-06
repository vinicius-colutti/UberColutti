import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { Platform, LoadingController } from '@ionic/angular';
import { Environment, GoogleMap, GoogleMapsEvent, GoogleMaps, GoogleMapOptions, MyLocation, GoogleMapsAnimation, Marker, Geocoder, ILatLng } from '@ionic-native/google-maps';
declare var google: any;
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild('map', {static:true}) mapElement: any;
  private loading: any;
  private map: GoogleMap;
  private search: string = '';
  private googleAutoComplete = new google.maps.places.AutocompleteService();
  public searchResults = new Array<any>();
  private originMarker: Marker;
  private destination: any;
  private googleDirectionsService = new google.maps.DirectionsService();
  constructor(
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private ngZone: NgZone
    ) {
      
    }

  ngOnInit(){
    this.mapElement = this.mapElement.nativeElement;

    this.mapElement.style.width = this.platform.width() + 'px';
    this.mapElement.style.height = this.platform.height() + 'px';

    this.loadMap();

  }

  async loadMap(){
    this.loading = await this.loadingCtrl.create({ message: "Por favor, aguarde..."});
    await this.loading.present();

    Environment.setEnv({
      'API_KEY_FOR_BROWSER_RELEASE': '#',
      'API_KEY_FOR_BROWSER_DEBUG': '#'
    });

    const mapOptions: GoogleMapOptions = {
      controls: {
         zoom: false
       }
    };

    this.map = GoogleMaps.create(this.mapElement, mapOptions);

    try {
      await this.map.one(GoogleMapsEvent.MAP_READY);

      this.addOriginMarker();
      
    } catch (error) {
      console.log(error);
    }

  }

  async addOriginMarker(){
    try {
      const myLocation: MyLocation = await this.map.getMyLocation();
      this.map.moveCamera({
        target: myLocation.latLng,
        zoom: 18
      });
      this.originMarker = this.map.addMarkerSync({
        title: 'Origem',
        icon: '#000',
        animation: GoogleMapsAnimation.DROP,
        position: myLocation.latLng
      })
    } catch (error) {
      console.log(error);
    } finally{
      this.loading.dismiss();
      
    }

  }

  searchChanged(){
    if(!this.search.trim().length) return;

    this.googleAutoComplete.getPlacePredictions({input: this.search}, predictions =>{
      this.ngZone.run(()=>{
        this.searchResults = predictions;
      })  
      
    })

  }

  async calcRoute(item: any){
    this.search = '';
    this.destination = item;
    const info: any = await Geocoder.geocode({address: this.destination.description});
    
    let markDestination: Marker = this.map.addMarkerSync({
      title: this.destination.description,
      icon: '#000',
      animation: GoogleMapsAnimation.DROP,
      position: info[0].position
    });

    this.googleDirectionsService.route({
      origin: this.originMarker.getPosition(),
      destination: markDestination.getPosition(),
      travelMode: 'DRIVING'
    }, async results =>{
      console.log(results);
      const points = new Array<ILatLng>();

      const routes = results.routes[0].overview_path;

      for(let i = 0; i < routes.length; i++){
        points[i] = {
          lat: routes[i].lat(),
          lng: routes[i].lng()
        }
      }

      await this.map.addPolyline({
        points: points,
        color: '#000',
        width: 3
      });

      this.map.panBy(0, 100);

      this.map.moveCamera({target: points});

    })
    
  }

  async back(){
    try {
      await this.map.clear();
      this.destination = null;
      this.addOriginMarker();
    } catch (error) {
      
    }
  }

}

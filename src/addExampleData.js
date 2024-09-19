import { API, graphqlOperation } from 'aws-amplify';
import { createGenre, createAlbum, createTrack } from './graphql/mutations';

const addExampleData = async () => {
  try {
    const genreData = await API.graphql(graphqlOperation(createGenre, { input: { name: 'Pop' } }));
    const genreId = genreData.data.createGenre.id;

    const fanaaAlbumData = await API.graphql(graphqlOperation(createAlbum, {
      input: {
        title: 'Fanaa',
        year: 2006,
        artUrl: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/Fanaa/art/Fanaa_2006_poster.jpg',
        genreID: genreId,
        artist: 'Jatin-Lalit',
        bandComposition: 'Lead Vocal, Guitar, Drums',
      }
    }));

    const fanaaAlbumId = fanaaAlbumData.data.createAlbum.id;

    const fanaaTracks = [
      {
        title: 'Chand Sifarish',
        albumID: fanaaAlbumId,
        url: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/Fanaa/tracks/Chand_Sifarish-VmusiQ.Com.mp3',
        label: 'YRF Music',
      },
      {
        title: 'Chanda Chamke',
        albumID: fanaaAlbumId,
        url: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/Fanaa/tracks/Chanda_Chamke-VmusiQ.Com.mp3',
        label: 'YRF Music',
      },
      {
        title: 'Dekho Na',
        albumID: fanaaAlbumId,
        url: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/Fanaa/tracks/Dekho_Na-VmusiQ.Com.mp3',
        label: 'YRF Music',
      },
      {
        title: 'Des Rangila',
        albumID: fanaaAlbumId,
        url: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/Fanaa/tracks/Des_Rangila-VmusiQ.Com.mp3',
        label: 'YRF Music',
      },
    ];

    for (const track of fanaaTracks) {
      await API.graphql(graphqlOperation(createTrack, { input: track }));
    }

    const ihlsAlbumData = await API.graphql(graphqlOperation(createAlbum, {
      input: {
        title: 'I Hate Luv Storys',
        year: 2010,
        artUrl: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/I+Hate+Luv+Storys+(2010)/art/MV5BZTRlMTAyNmQtZjA2Zi00MmMzLThlZjItODRmZWJhNTNiYWYxXkEyXkFqcGdeQXVyODE5NzE3OTE%40._V1_.jpg',
        genreID: genreId,
        artist: 'Vishal-Shekhar',
        bandComposition: 'Lead Vocal, Guitar, Drums, Bass',
      }
    }));

    const ihlsAlbumId = ihlsAlbumData.data.createAlbum.id;

    const ihlsTracks = [
      {
        title: 'Bahara Chill Version',
        albumID: ihlsAlbumId,
        url: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/I+Hate+Luv+Storys+(2010)/tracks/Bahara+Chill+Version.mp3',
        label: 'T-Series',
      },
      {
        title: 'Bahara',
        albumID: ihlsAlbumId,
        url: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/I+Hate+Luv+Storys+(2010)/tracks/Bahara.mp3',
        label: 'T-Series',
      },
      {
        title: 'I Hate Luv Storys',
        albumID: ihlsAlbumId,
        url: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/I+Hate+Luv+Storys+(2010)/tracks/I+Hate+Storys+Luv.mp3',
        label: 'T-Series',
      },
      {
        title: 'Jab Tu Mila',
        albumID: ihlsAlbumId,
        url: 'https://dreamstreamer-songs.s3.amazonaws.com/albums/I+Hate+Luv+Storys+(2010)/tracks/Jab+Tu+Mila.mp3',
        label: 'T-Series',
      },
    ];

    for (const track of ihlsTracks) {
      await API.graphql(graphqlOperation(createTrack, { input: track }));
    }

    console.log('Albums and tracks added successfully!');

  } catch (error) {
    console.error('Error adding example data:', error);
  }
};

export default addExampleData;

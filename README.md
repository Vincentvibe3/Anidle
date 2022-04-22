# Anidle

![Screenshot of https://anidle.vercel.app](https://github.com/Vincentvibe3/Anidle/blob/main/Screenshot.png)

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
&nbsp;![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)
&nbsp;![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
&nbsp;![Svelte](https://img.shields.io/badge/svelte-%23f1413d.svg?style=for-the-badge&logo=svelte&logoColor=white)

[Try it out here](https://vercel.com/vincentvibe3/anidle)

---

A [Heardle](https://www.heardle.app/) clone but for anime opening built with [Svelte](https://svelte.dev/)

Videos from [Animethemes.moe](https://animethemes.github.io/animethemes-web/)

Processed videos are mirrored and stored on [Supabase](https://supabase.com/)

## Adding songs

Open an [issue](https://github.com/Vincentvibe3/Anidle/issues) or open a Pull Request with an edit to [songs.json](https://github.com/Vincentvibe3/Anidle/blob/main/songs.json)

## Setup

Install dependencies with

```console
npm install
```

Set the following environment variables

```properties
# To fetch metadata for select openings
VITE_SPOTIFY_CLIENT=<Spotify Api Client Id>
VITE_SPOTIFY_SECRET=<Spotify Api Client Id>

# To access mirrored songs
VITE_SUPABASE_KEY=<Supabase Anon Key>
VITE_SUPABASE_URL=<Supabase API link>
# Must be a public bucket
VITE_BUCKET_NAME=<storage bucket name>
# Credential for a Supabase User than can read the bucket's info
VITE_USERNAME=<Username/email>
VITE_PASSWORD=<Password>

```

Run for development

```console
npm run dev
```

## Using Supabase to serve optimized media

*The processing script is currently only for UNIX systems*

Install dependencies

```console
cd videoProcessing
npm install
```

Install ffmpeg from [Here]()

Set environment variables

```properties
# To create the Supabase client
SUPABASE_KEY=<Supabase Anon Key>
SUPABASE_URL=<Supabase API link>

# Only needed to create a user with createUser.js
SUPABASE_SERVICE_KEY=<Supabase Service key>

# Crendentials to user with permission to modify the bucket
EMAIL=vincentvibe3@gmail.com
PASSWORD=2GZEUt53_ASuDLILwaploA

# Must be a public bucket
BUCKET_NAME=<storage bucket name>
```

Run scripts

```
chmod +x ./getKeyframes.sh
node downloader.js ../songs.json
node process.js
```
Check [this workflow]() for the github action automating the processing.
## Epidemic control for volunteers - Toolkit

**NOTE: This site is currently being updated with revised content. Thank you for your patience.**

### Project overview

The intention of this project is to deliver the toolkit as a static HTML website, PDF, and as an offline Android app from a single source of data/content. The content is stored in plain text files in the 'app/\_disease', 'app/\_action', and 'app/\_message' directories. Site translations are stored in plain text files in the 'app/\_data' folder. The website is built using [Jekyll](https://jekyllrb.com/). PDFs will be generated via a TBD javascript library.

The automated deployment process also creates the `_android` branch which is bundled Adobe PhoneGap using their PG Build App.
You can download an .apk file to install the website for offline access on an Android device [here](https://build.phonegap.com/apps/3033001/share).

### The toolkit

The Epidemic Control for Volunteers training manual and accompanying toolkit are intended for at volunteers and their trainers in local branches of National Societies. Whilst not exhaustive, the training aims to familiarize volunteers with the most common epidemics and those that cause the most death and suffering. It encourages them to use evidence-based actions and approaches to prevent the spread of communicable diseases in their communities, provide appropriate care for the sick and reduce the number of deaths.

When an epidemic strikes, there are many ways that volunteers can help. This manual and toolkit are designed to help volunteers define their role in the community before, during and after an epidemic and to take the actions that are best suited to that particular epidemic. The knowledge and skills acquired will enable them to act quickly and effectively in the event of an epidemic. The training will also be useful to them in dealing with other emergencies.

The toolkit is currently going through revision. If you have access to fednet you can download the previous version [here](https://fednet.ifrc.org/en/resources/health/emergency-health/communicable-diseases-in-emergencies/epidemic-control-for-volunteers/).

### Adding Language support

The site is configured to support 2-letter core language codes. So english is 'en' not 'en-US' and/or 'en-GB'. Using a longer code will not function. To incorporate a language:

1. tell app config the language exists
    1. add 2-letter language code to `authorized_locales` array in '\_config.yml'
    2. add the text name of the language to `locale_names`
2. include locale file (to support date/time localization)
    1. several already in place (in 'app/\_locales' dir), otherwise get from [here](https://github.com/svenfuchs/rails-i18n/tree/master/rails/locale)
3. include 'app/\_data/`2-letter code`.yml' to support site content translations
    1. copy 'app/\_data/en.yml', then update text values
4. create folder of page templates
    1. copy 'app/en' dir, rename copy as your 2-letter language code
    2. in frontmatter for all templates there within, you only need to change the language code for `lang`
5. translate content
    1. copy all files ending in '\_en.md' in the 'app/\_disease', 'app/\_action', and 'app/\_message' dir
    2. in frontmatter for all files, you need to change the `lang` to the correct code and translate the `slug`
    3. all the text below the frontmatter should be translated

### Internal cross links

Sometimes you want to include a link from one page to another (for example, from the page for Action Tool 1 to Action Tool 4).

```
(see Action Tool 3 <a class="crosslink" href="{% render_depth %}{% render_link action|3 %}"><i class="fas fa-external-link-alt" aria-hidden="true"></i></a>)
```

Follow the above format and edit `{% render_link action|3 %}`:
- change `action` to `action`, `disease`, or `message`
- change `3` to the `identifier` value from the YAML front matter at top of a document
- the language for the link will automatically match the language of the displayed page

The link is attached to a separate icon and not the text so that it can be hidden via css when creating the PDF files. Links made like the second link in the below screenshot.

![two link examples](https://user-images.githubusercontent.com/4806884/42845290-783d620e-89e3-11e8-9f43-f5e87b25d43f.png)

Otherwise, in the generated PDFs you will end up with a link the user can click that goes to a broken URL such as `http://localhost:3000/action/referral-to-health-facilities/`.

![broken link in pdf](https://user-images.githubusercontent.com/4806884/42845206-368e339c-89e3-11e8-9c64-11244d58e4f4.png)

### Android app only styling

The Android app is just the mobile-friendly website packaged for install on a phone to make it available without internet. Some of the page elements shouldn't be displayed. As part of the `gulpfile.js` processes, a link on each page loading the `/app/assets/styles/android.css` is uncommented. Currently, this adds `display: none;` css to a `hide-for-android` class that is used on page elements such as links to download a PDF and links to share the website to social media.

## Development

### Environment

To set up the development environment for this website, you'll need to install the following on your system:

- Install [nvm](https://github.com/creationix/nvm)
- run `nvm use` to read the '.nvmrc' file and switch to the correct version of node
- [rvm](https://rvm.io/) and [Bundler](http://bundler.io/)
- `rvm use 2.3.1`
- Gulp (install using `npm install -g gulp`)

After these basic requirements are met, run the following commands in the website's folder:
```
$ npm install
```
This will also run `bundle install` (see `scripts` in 'package.json')


### Getting started

```
$ gulp serve
```
Compiles the site, and launches a server making the site available at `http://localhost:3000/`. The system will watch files and execute tasks whenever one of them changes. The site will automatically refresh when files change. The `_config-dev.yml` file will be loaded alongside `_config.yml`.

### Other commands

```
$ gulp clean
```
Cleans the compiled site.

```
$ gulp prod
```
Compiles the site loading the `_config-prod.yml` alongside `_config.yml`.

### Travis-CI

I created a new personal access token with 'public_repo - Access public repositories' permissions. Copied the token and used it in `travis encrypt GH_TOKEN=my_github_token --add env.matrix` as described in the [Travis-CI docs](https://docs.travis-ci.com/user/environment-variables#Encrypting-environment-variables).

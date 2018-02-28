## Epidemic control for volunteers - Toolkit

**NOTE: This site is currently a work in progress and does NOT have actual content. Please do not reference if looking for the toolkit content**

### Project overview

The intention of this project is to deliver the toolkit as a static HTML website, PDF, and as an offline Android app from a single source of data/content. The content is stored in plain text files in the 'app/\_disease', 'app/\_action', and 'app/\_message' directories. Site translations are stored in plain text files in the 'app/\_data' folder. The website is built using [Jekyll](https://jekyllrb.com/). The plan for the Android app is to embed the website files within a simple webview app, so that the phone can open the website using the stored files, instead of connecting to the web. PDFs will be generated via a TBD javascript library.

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

## Development

### Environment

To set up the development environment for this website, you'll need to install the following on your system:

- Install [nvm](https://github.com/creationix/nvm) 
- run `nvm use` to read the '.mvmrc' file and switch to the correct version of node
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
 
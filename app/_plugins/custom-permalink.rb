module Jekyll
  module CustomPermalink
    class Generator < Jekyll::Generator
      priority :normal

      def generate(site)
        # grab the translations from the _config.yml file
        configs = site.config['collections'];
        # loop through the collections
        site.collections.each do |collection|
          # grab the name of the collection
          thiscollection = collection[0]
          # Jekyll.logger.info thiscollection         # 'action', 'disease', or 'message'
          # by default 'posts' exists but is empty in this case, so we ignore it
          if thiscollection != 'posts'
            # loop through each file in the collection
            site.collections[thiscollection].docs.each do |doc|
              # grab the language code in the file yaml front matter
              langcode = doc.data['lang']
              if(langcode != 'en')
                # our permalink will start with the language code
                urlstart = '/' + langcode
              else
                # except the default_locale doesn't get a url language prefix
                urlstart = ''
              end
              if(configs[thiscollection]).has_key?(langcode)
                # grab the translation for the collection name
                group = configs[thiscollection][langcode]
              else
                # if no translation, replace with default/English name of collection
                group = thiscollection
              end
              # set the permalink value
              doc.data['permalink'] = urlstart + '/' + group + '/:slug/'
            end
          end
        end
      end
    end
  end
end

require 'i18n'

module Jekyll
  module CustomPermalink
    class Generator < Jekyll::Generator
      priority :normal

      def generate(site)  
        # grab the translations from the _config.yml file
        configs = site.config['collections'];
        # loop through the pages (inside the 2 letter language folders, i.e. index.html, actions.html)
        site.pages.each do |page|
          # grab the language code from the yaml front matter
          langcode = page.data['lang']
          if page['identifier'] == 'index'
            # if it's index, set permalink from home url in a language file in the `_data` folder
            page.data['permalink'] = site.data[langcode]['home']
          else
            # othewise, grab the collection the page is the landing for 
            collection = page.data['listing']
            # and then set permalink from right value in a language file in the `_data` folder
            page.data['permalink'] = site.data[langcode]['collections'][collection]['url']
          end
        end  
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
              # grab the translation from the language data files
              urlstart = site.data[langcode]['collections'][thiscollection]['url']
              # strip accent marks from title
              doc.data['slug'] = I18n.transliterate(doc.data['title'])
              # set the permalink value
              doc.data['permalink'] = urlstart  + ':slug/'
            end
          end
        end
      end
    end
  end
end

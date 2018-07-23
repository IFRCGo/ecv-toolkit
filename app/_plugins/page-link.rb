module Jekyll
  class RenderLinkTag < Liquid::Tag

    def initialize(tag_name, input, tokens)
      super
      @input = input
    end

    def render(context)
      lang = context.environments.first["page"]["lang"]
      input_split = @input.split("|")
      coll = input_split[0].to_s.strip
      numb = input_split[1].to_s.strip
      site = context.registers[:site]
      site.collections[coll].docs.each do |doc|
        thisnumb = doc.data['identifier'].to_s.strip
        if doc.data['lang'] == lang
          if doc.data['identifier'].to_s == numb
            return doc.url[1..-1] # trim the leading "/" since we will add page depth when building the url
          end
        end
      end
      return nil
    end

  end
end

Liquid::Template.register_tag('render_link', Jekyll::RenderLinkTag)

# example usage
# =============
# href="{% render_depth %}{% render_link disease|4 %}"
# href="{% render_depth %}{% render_link action|6 %}"

module Jekyll
  class RenderDepth < Liquid::Tag
    def render(context)
      page_url = context.environments.first["page"]["url"]
      page_depth = page_url.split('/').size
      render_depth = ''
      for i in 2..page_depth do
        render_depth += '../' 
      end
      "#{render_depth}"
    end
  end
end

Liquid::Template.register_tag('render_depth', Jekyll::RenderDepth)
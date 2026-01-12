#!/usr/bin/env perl
use Mojolicious::Lite -signatures;

# BarefootJS + Mojolicious Demo
#
# This demonstrates "Marked Templates" - a language-agnostic way to use
# BarefootJS with any server-side language.
#
# Run: morbo app.pl
# Then open: http://localhost:3000

# Helper to generate unique instance IDs
my $instance_counter = 0;
helper bf_instance_id => sub ($c, $name) {
  my $id = sprintf('%s_%06d', $name, ++$instance_counter);
  return $id;
};

# Serve static files from public/
app->static->paths->[0] = app->home->child('public');

# Main page with Counter components
get '/' => sub ($c) {
  $c->stash(
    instance_id1 => $c->bf_instance_id('Counter'),
    count1       => 0,
    instance_id2 => $c->bf_instance_id('Counter'),
    count2       => 100,
  );
  $c->render(template => 'index');
};

# API endpoint to demonstrate server-side state
get '/api/count' => sub ($c) {
  $c->render(json => { count => int(rand(1000)) });
};

app->start;

__END__

=head1 NAME

BarefootJS Mojolicious Demo

=head1 DESCRIPTION

This demo shows how BarefootJS "Marked Templates" can work with
any server-side language. The key insight:

1. The server renders HTML with data attributes (data-bf-scope, data-bf)
2. The Client JS finds elements by these attributes
3. Reactivity is handled entirely on the client

The template format is simple enough to work with any template engine:
- ERB (Ruby)
- Jinja2 (Python)
- Blade (PHP)
- EP (Perl/Mojolicious)
- Go templates

=head1 USAGE

  # Install Mojolicious
  cpanm Mojolicious

  # Run the app
  cd examples/mojolicious
  morbo app.pl

  # Open browser
  open http://localhost:3000

=cut

# syntax=docker/dockerfile:1
#
# Build & runtime image for the Mojolicious example, intended to be executed
# inside a Cloudflare Container. Requires `bun run build` to have been run on
# the host first so dist/ (templates, client JS, styles) and lib/ (BarefootJS
# Perl plugin) exist alongside app.pl.

FROM perl:5.38-slim AS deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends make gcc libc-dev \
 && rm -rf /var/lib/apt/lists/*
RUN cpanm --notest Mojolicious

FROM perl:5.38-slim
RUN useradd -m -r -s /bin/false app
WORKDIR /app

COPY --from=deps /usr/local/lib/perl5 /usr/local/lib/perl5
COPY --from=deps /usr/local/share/perl /usr/local/share/perl
COPY --from=deps /usr/local/bin /usr/local/bin

COPY app.pl ./
COPY lib ./lib
COPY dist ./dist

ENV BASE_PATH=/examples/mojolicious
ENV MOJO_MODE=production
EXPOSE 8080
USER app
CMD ["perl", "app.pl", "daemon", "-l", "http://*:8080"]

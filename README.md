## Repository for the fuites anarchive v2

The repo uses npm workspaces. Packages are divided up into a backend application (be) and frontend (fe) packages. To install and run locally:

1. clone or fork the repository:
2. Make sure to have installed and be using Node.js 20.9 or higher.
3. Configure a self-signed certificate for local HTTPS support (see the section below on how to do this).
4. Add .env files to both the `packages/be` directory and the `packages/fe` directory (email contact@fuit.es to get these files)
5. from the repo root run `npm ci` and then run `npm run be:dev`
6. In a second terminal (or command line) window, from the repo root run `npm run fe:dev`


## Self-signed certificate

In order to use the site in local development mode, two files must be added to the repo root. 
The following commands will work on MacOS but if mkcert is installed by another package manager, this can be run on any version of *nix.

In a terminal shell:
1. `cd ~/.ssh`
2. `brew install mkcert`
3. `mkcert -install`
4. `mkcert -key-file localhost_key.pem -cert-file localhost_cert.pem localhost 127.0.0.1`
5. `cat localhost_cert.pem > localhost_fullchain.pem`
6. `cat "$(mkcert -CAROOT)/rootCA.pem" >> localhost_fullchain.pem`

Now, navigate back to your cloned repo, into the root directory. Add the two generated .pem files to the repo with the following command. These keys are .gitignored by default.

`cp -v ~/.ssh/localhost_cert.pem ~/.ssh/localhost_key.pem .`

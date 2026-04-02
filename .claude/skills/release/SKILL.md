# Release

Deploy the application to production on Vercel.

## Steps

1. Verify all changes are committed: `git status`
2. Run build check: `npm run build`
3. Run lint check: `npm run lint`
4. Push to deployment branch: `git push origin vercel-build-production`
5. Deploy to Vercel: `vercel --prod --yes`
6. Verify deployment at https://avirato-reserve-viewer.vercel.app
7. Report deployment status

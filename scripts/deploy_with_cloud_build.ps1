Param(
    [string]$SERVICE = "ipdr-graph-engine-api",
    [string]$REGION  = "us-central1",
    [string]$TAG     = (Get-Date -Format "yyyyMMddHHmmss")
)

Write-Host "Deploying to Google Cloud Run using Cloud Build..."
Write-Host "Service: $SERVICE - Region: $REGION - Tag: $TAG"

# get currently configured gcloud project
$PROJECT = (& gcloud config get-value project).Trim()
if (-not $PROJECT) {
    Write-Error "No gcloud project configured. Run: gcloud config set project <PROJECT_ID>"
    exit 1
}

$IMAGE = "gcr.io/$PROJECT/$($SERVICE):$($TAG)"

Write-Host "Starting Cloud Build -> Image: $IMAGE"

# Submit the backend folder to Cloud Build (it will use Dockerfile present in backend/)
gcloud builds submit backend --tag $IMAGE --project $PROJECT
if ($LASTEXITCODE -ne 0) { Write-Error "Cloud Build failed"; exit $LASTEXITCODE }

Write-Host "Build finished. Deploying to Cloud Run..."

gcloud run deploy $SERVICE `
  --image $IMAGE `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --project $PROJECT `
  --port 8080

if ($LASTEXITCODE -ne 0) { Write-Error "gcloud run deploy failed"; exit $LASTEXITCODE }

Write-Host "Deployment completed. Service URL:"
& gcloud run services describe $SERVICE --platform managed --region $REGION --project $PROJECT --format 'value(status.url)'

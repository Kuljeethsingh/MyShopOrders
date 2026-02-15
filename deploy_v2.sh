#!/bin/bash

# Configuration
PROJECT_ID="sweetshop-487106"
SERVICE_NAME="sweetshop-app"
REGION="asia-south2"

# Secrets
SHEET_ID="1gjjyvjhcWDkKp-zyB0ZIb_ebvo0UZhhjf5-Kyji9W70"
SERVICE_EMAIL="sweet-448@sweetshop-487106.iam.gserviceaccount.com"
NEXTAUTH_SECRET="secret123"
EMAIL_USER="kuljeethsingh1224@gmail.com"
EMAIL_PASS="swyy tlel csoz bvhk"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_SF5yzloT9HllfK"
RAZORPAY_KEY_SECRET="ze9SoFkDjI14OfYz6Mf4f0Bh"
PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDRornAdlXoUnar\nzFyVq70YmGMcgU6ovMdsNOig+XPDFXkxXOyh1egJUY9flCNcuSlj352BN2bpX4jk\n/BDdDRp3FgjmjXQzGuss50JK7Q3NUXe8UqlI5caMR2sIivySEOcDp7Yjcx2TYs0z\nyhpTqDq3jhiDaRg7cyuVDJ/iaxO10m9x8N7VtSlNbHrEwPNelE9ri5dne9aEVI+p\nbWgbqOrVuXxgiV5dAlKXm8TP9n/KZoMa+cOnstgJVm7ZkCgeR7aXYX66rg8SX99e\nlOEI+Wcx4YMh1ZNXKG2kPx0GnfGVh03HjPhDkGvcemcEZtB6OvmgNb6eWzkptBgd\ns9rkKouZAgMBAAECggEAXy+5kxvIPyBudOxqn6Umy+upmRBXpINvM4FEnY8W0p5F\n9LWCVqt3W//WD2qGsfv7QLeQ31LGHjI8SOjxSUXBXhA5w2G4QNo4rZ9l+PpxOWiD\n6xVHe2ulvx1QisT9EN+u3XiB2c/Tvo/up9TdJl4tJxpUpBqMn7XYNKnSUS8YeIY9\nFM1fQrS6mVhw/ECxGtqsU6qDvrqeVga3s8IFf7YrFgSlKAzb0luJkjFp5Mre+vUK\n5dVY8JJO0339WVw6XexDZJwSFE1bBc+jnK0hdhqyz6GrdhF3wBwzEdlzLvn8hTkv\n7yjmOU6up8fUS9nuaOuSQLup+TkOrXqE77Te+0+/BwKBgQD5V7CvHGTqj646nykQ\nFbtPA9pe/0dKBLjy71sajGj+u62Q7VETaCaxhp289H6G6AyD54AXbvuNVQCdG+19\ndpAvHaYXYdLeFt0u9IcL+TZZAhe6FIXmu66+YNOdTncOJWcL6ccDrsWZngHsrgIo\nL0a771hVo3Yo+1DU4bxvMF+jgwKBgQDXO6FZ3Ug7sfPcX5RXIn96gLGOfnDJG9gc\nJgS3gZmMeq0lCTlIgdE1GBKWJaUHBBDmRnsxbvWSvO5bs7hOIUQKoJ4KXBdpt4vh\nx3ZBzvfQMiH2yYEFmncFPo4I7EMpa6njlZ0hp3lmUkDIP3KG+9aA79n+Mqdu3lCX\nQJRL+kc9swKBgQCEiYwtSJaL6BvgpUGafzK1aYLmBCPMwH3fBEQU9JXK8c/svXjf\nK/mFW9z017F53Fbqtl9sFV45XfmZiYLPsfoqUUQ8IY+I5fZkQy6Vur6cyXP7QXV7\nlD/qimVxtIesSU1hE77pwjje0xKK0GPtIFQlCbCWtPDWD+CDiAo1wCzWKQKBgQDL\n/p2AEeYbhh9OeFyddXoDfqRLHPYC9lwO2c3Qq4oABmnC14ouebPysZ00J/vQuX7W\n8mhiwvsIF/+GdMEzc/4MYI1J3lzmeuuek7E20FY6QrnEMNoTmIJEOzTdqihBwuRj\navNh6Vx7qWvzH4eJ/nkg/bPMZPAieZ1CrhegJ1eMVwKBgQDb6s08XFtY8mSMv4x7\ndjr2R+zSbxjmGSVtyDEk5PRtanpbtsIQLGbBKua8Yu089BfTzmEeCFYIvmhs0J8F\nkG+hSf2VFrXkoFvOwI/UrIYyFNJpk9paq1Go2Li346U0SdsfSusASPrHiA7pqXoR\niHAXl9Z9o9B4MTbjg2MXXwvGLw==\n-----END PRIVATE KEY-----\n'

# URL (Pre-calculated or updated later)
NEXTAUTH_URL="https://sweetshop-app-651619400820.asia-south2.run.app"

echo "Deploying $SERVICE_NAME to $REGION..."

gcloud run deploy $SERVICE_NAME \
  --project $PROJECT_ID \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_SHEET_ID=$SHEET_ID" \
  --set-env-vars "GOOGLE_SERVICE_ACCOUNT_EMAIL=$SERVICE_EMAIL" \
  --set-env-vars "NEXTAUTH_URL=$NEXTAUTH_URL" \
  --set-env-vars "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" \
  --set-env-vars "EMAIL_USER=$EMAIL_USER" \
  --set-env-vars "EMAIL_PASSWORD=$EMAIL_PASS" \
  --set-env-vars "NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID" \
  --set-env-vars "RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET" \
  --set-env-vars "GOOGLE_PRIVATE_KEY=$PRIVATE_KEY"

echo "Deployment finished."

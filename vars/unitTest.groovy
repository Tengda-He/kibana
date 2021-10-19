label 'test'
def kibanaVersion = '7.7.1'
def scmVars = checkout scm
sh "env"
echo "BRANCH: ${scmVars.GIT_BRANCH}, COMMIT: ${scmVars.GIT_COMMIT}"
def imageName = "test-image:${env.BUILD_ID}"
def testImage

stage('Build container image') {
    sh 'ls -l'
    testImage = docker.build imageName
}

try {
    testImage.inside {
        sh 'uname -a'
        // Fixing out of memory issues
        // https://github.com/elastic/kibana/blob/e30220f04c517c17d3cc026b23493f827643166f/src/dev/build/README.md#fixing-out-of-memory-issues
        // m5.2xlarge has total 32 GB, we will only run two execution per node. use either 4G or 8G for build/test
        env.NODE_OPTIONS = '--max_old_space_size=8192'
        env.TEST_BROWSER_HEADLESS=1
        env.KIBANA_DIR=sh(script: 'pwd', , returnStdout: true).trim()
        sh 'node --version'
        sh 'rm -rf target/junit'
        sh 'rm -rf junit-test'
        sh 'mkdir junit-test'

        stage('Bootstrap') {
            sh 'yarn kbn bootstrap'
        }

        stage('Build') {
            sh 'yarn build --oss --skip-os-packages'
        }

        stage('Unit Test') {
            echo "Start Unit Tests"
            def utResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake yarn test:jest -u --ci'

            if (utResult != 0) {
                currentBuild.result = 'FAILURE'
            }

            junit 'target/junit/TEST-Jest Tests*.xml'
        }
    }
}




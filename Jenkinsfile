node("test") {
    def kibanaVersion = '6.5.4'
    def scmVars = checkout scm
    sh "env"
    def imageName = "${env.BRANCH_NAME}-test-image:${env.BUILD_ID}"
    def testImage

    stage('Build container image') {
        sh 'ls -l'
        sh 'docker -v'
        testImage = docker.build imageName
    }

    try {
        testImage.inside {
            sh 'uname -a'
            env.NODE_OPTIONS = '--max_old_space_size=8192'
            env.TEST_BROWSER_HEADLESS=1
            env.KIBANA_DIR=sh(script: 'pwd', , returnStdout: true).trim()
            sh 'which npm'
            sh 'npm --version'
            sh 'rm -rf target/junit'
            sh 'rm -rf junit-test'
            sh 'mkdir junit-test'

            stage('Bootstrap') {
                sh 'yarn add --dev jest-junit@7'
                sh 'google-chrome -v'
                sh 'yarn add chromedriver@79'
                sh 'yarn kbn bootstrap'
            }

            // stage('Unit Test') {
            //     echo "Starting Unit Test..."
            //     def utResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake node scripts/jest -u --ci'

            //     if (utResult != 0) {
            //         currentBuild.result = 'FAILURE'
            //     }
                
            //     junit 'target/junit/TEST-Jest Tests*.xml'
            // }

            // stage('Integration Test') {
            //     echo "Start Integration Tests"
            //     def itResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake node scripts/jest_integration -u --ci'

            //     if (itResult != 0) {
            //         currentBuild.result = 'FAILURE'
            //     }

            //     junit 'target/junit/TEST-Jest Integration Tests*.xml'
            // }
            
            stage("Run Elasticsearch") {
                sh "curl https://storage.googleapis.com/kibana-ci-es-snapshots-permanent/6.8.10/elasticsearch-6.8.10-SNAPSHOT.tar.gz --output elasticsearch.tar.gz"
                echo "Starting Elasticsearch..."
                sh "tar -xf elasticsearch.tar.gz"
                sh "./elasticsearch-6.8.10-SNAPSHOT/bin/elasticsearch & "
            }
            
            stage("Run Kibana") {
                echo "Starting Kibana..."
                sh "./bin/kibana --no-base-path 2>&1 | tee kibana.log & "
            }
            
            stage("Run Functional Test") {
                sh "sleep 60"
                sh "curl localhost:9200"
                sh "curl localhost:5601"
                echo "Start Functional Tests"
                
                withEnv([
                    "TEST_BROWSER_HEADLESS=1",
                    "CI=1",
                    "TEST_ES_PORT=9200",
                    "TEST_KIBANA_PORT=5601",
                    "TEST_KIBANA_PROTOCOL=http",
                    "TEST_ES_PROTOCOL=http",
                    "TEST_KIBANA_HOSTNAME=localhost",
                    "TEST_ES_HOSTNAME=localhost"
                ]) {
                
                    def utResult = sh returnStatus: true, script: 'CI=1 GCS_UPLOAD_PREFIX=fake node scripts/functional_test_runner'
    
                    if (utResult != 0) {
                        currentBuild.result = 'FAILURE'
                    }

                    junit 'target/junit/TEST-Jest Functional Tests*.xml'
                }
            }
        }
    } catch (e) {
        echo 'This will run only if failed'
        currentBuild.result = 'FAILURE'
        throw e
    }
}
NODE_SOURCE = '/tmp/setup_node.sh'

package 'build-essential'
remote_file NODE_SOURCE do
  source 'https://deb.nodesource.com/setup_6.x'
  mode '0755'
  action :create
end
execute NODE_SOURCE
package 'nodejs'

file "/etc/apt/sources.list.d/mongodb-org-3.2.list" do
  content "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse"
end

apt_update "Update ubuntu mirrors"
package "mongodb-org" do
  options '-y --allow-unauthenticated'
end

package "git"
package "python3"
package "python3-pip"
package "python-dev"
package "libxml2-dev"
package "libxslt1-dev"
package "zlib1g-dev"
package "python3-lxml"
package "python3-requests"


execute 'Install global npm packages' do
  command 'npm install -g gulp forever'
end

execute 'Install python dependencies' do
    command 'pip3 install -r packages/custom/expertise/server/bugzilla-python/requirements.txt'
    cwd '/vagrant'
end

execute 'Install npm packages' do
  command 'npm install'
  cwd '/vagrant'
end

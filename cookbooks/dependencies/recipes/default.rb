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

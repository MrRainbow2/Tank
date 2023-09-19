# 构建阶段。。。就直接随意copy个代码
FROM private-registry.sohucs.com/domeos-pub/node:16.15.1-centos as builder
WORKDIR /fe
COPY . /fe

FROM private-registry.sohucs.com/domeos-pub/nginx:1.13.7-alpine
COPY default.conf /etc/nginx/conf.d
COPY --from=builder /fe /usr/share/nginx/html

EXPOSE 80
CMD ["nginx","-g","daemon off;"]